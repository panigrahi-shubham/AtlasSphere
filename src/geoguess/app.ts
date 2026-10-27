import { geoEquirectangular, geoPath, geoMercator } from 'd3-geo';
import { countryFeatures, makeRounds, haversine, landmarkPoints, outlinePoints, displayDistance, cleanBoard, leaderboardInsert, STORAGE_KEY, ROUNDS } from './logic.ts';
import { readJSON, STORAGE_KEYS } from '../utils/storage.js';
import { initBugMode } from '../dev/bugMode.js';

const root = document.querySelector('#geoguess-root');
const NS = 'http://www.w3.org/2000/svg';
const params = new URLSearchParams(location.search);
const bugMode = import.meta.env.DEV && params.get('bugMode') === '1';
const defects = new Set(bugMode ? (params.get('bugs') ?? '').split(',') : []);
const key = bugMode ? `earthscope:practice:${STORAGE_KEY}` : STORAGE_KEY;
const modeParam = params.get('mode');
let mode = modeParam === 'outline' || modeParam === 'landmark' ? modeParam : null;
function randomSeed() { return 1 + Math.floor(Math.random() * 2147483646); }
let seed = /^[1-9]\d*$/.test(params.get('seed') ?? '') && Number.isSafeInteger(Number(params.get('seed'))) ? Number(params.get('seed')) : randomSeed();
let rounds = [], round = 0, score = 0, status = 'idle', timeLeft = 30, results = [], timer, deadline, guess, selected, highlighted;
let board = readBoard();
function readBoard() { try { return cleanBoard(JSON.parse(localStorage.getItem(key))); } catch { return cleanBoard(null); } }
function saveBoard() { try { localStorage.setItem(key, JSON.stringify(board)); return true; } catch { return false; } }
function unit() { return readJSON(STORAGE_KEYS.unit).value === 'fahrenheit' ? 'fahrenheit' : 'celsius'; }
function link(start = false) { const url = new URL('/geoguess', location.href); url.searchParams.set('mode', mode); url.searchParams.set('seed', String(seed)); if (start) url.searchParams.set('start', '1'); if (bugMode) { url.searchParams.set('bugMode', '1'); url.searchParams.set('bugs', [...defects].join(',')); } return url; }
function updateUrl(start = false) { history.replaceState(null, '', link(start)); }
function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; }
function button(label, id, action) { const b = el('button', '', label); b.type = 'button'; b.dataset.testid = id; b.addEventListener('click', action); return b; }
function svg(tag, attributes = {}) { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attributes)) n.setAttribute(k, String(v)); return n; }
function title() { document.title = `${status === 'playing' ? '? ' : ''}GeoGuess — SkyAtlas`; }
function start(chosen = mode, same = true) { clearInterval(timer); mode = chosen; if (!same) seed = randomSeed(); updateUrl(true); rounds = makeRounds(mode, seed); round = 0; score = 0; results = []; play(); }
function selectScreen() {
  status = 'idle'; title(); root.replaceChildren();
  const hero = el('section', 'gg-hero'); hero.append(el('p', 'eyebrow', 'SkyAtlas game'), el('h1', '', 'GeoGuess'), el('p', '', 'How well do you know our planet? Five rounds, thirty seconds each.'));
  const cards = el('div', 'gg-modes');
  for (const [value, icon, label, copy] of [['landmark', '◎', 'Landmark Pin', 'Find a landmark on the world map.'], ['outline', '◈', 'Country Outline', 'Recognise a country from its silhouette.']]) {
    const card = el('button', 'gg-mode', ''); card.type = 'button'; card.dataset.testid = `gg-mode-${value}`; card.setAttribute('aria-pressed', String(mode === value));
    card.append(el('span', 'gg-mode-icon', icon), el('strong', '', label), el('span', '', copy));
    card.addEventListener('click', () => { mode = value; updateUrl(); selectScreen(); root.querySelector(`[data-testid="gg-mode-${value}"]`).focus(); }); cards.append(card);
  }
  hero.append(cards); const actions = el('div', 'gg-actions'); actions.append(button('Start five-round game', 'gg-start', () => start(mode)), el('p', '', 'Your scores stay in this browser. No account or weather request is needed.')); actions.querySelector('button').disabled = !mode; hero.append(actions); root.append(hero); renderLeaderboard();
}
function play() {
  status = 'playing'; timeLeft = 30; deadline = Date.now() + 30000; guess = null; selected = null; highlighted = null; title(); root.replaceChildren();
  const bar = el('div', 'gg-topbar'); bar.append(el('h1', '', 'GeoGuess'));
  const progress = el('p', '', `Round ${round + 1} / ${ROUNDS}`); progress.dataset.testid = 'gg-round'; bar.append(progress);
  const total = el('p', '', `${score} points`); total.dataset.testid = 'gg-score'; bar.append(total);
  const clock = el('div', 'gg-clock'); clock.setAttribute('role', 'timer'); const seconds = el('strong', '', '30'); seconds.dataset.testid = 'gg-timer'; clock.append(seconds, el('span', '', 'seconds')); bar.append(clock); root.append(bar);
  const live = el('p', 'sr-only'); live.setAttribute('aria-live', 'polite'); root.append(live);
  const question = el('section', 'gg-play'); const q = el('h2', '', mode === 'landmark' ? `Find ${rounds[round].answer} — ${rounds[round].country}` : 'Which country is this?'); q.dataset.testid = 'gg-question'; question.append(q);
  if (mode === 'landmark') renderMap(question); else renderOutline(question);
  root.append(question);
  const tick = () => { if (status !== 'playing' && !(status === 'answered' && defects.has('GG-BUG-2'))) return; const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000)); if (next !== timeLeft) { timeLeft = next; seconds.textContent = String(next); clock.dataset.warning = next <= 5 ? 'urgent' : next <= 10 ? 'soon' : ''; if (next === 10 || next === 5) live.textContent = `${next} seconds remaining`; } if (next === 0 && status === 'playing') finish(null, true); };
  timer = setInterval(tick, 100); tick();
}
function renderMap(parent) {
  const hint = el('p', '', 'Click the map to place a pin, or focus it: arrows move the crosshair by 2°, Enter places it.'); parent.append(hint);
  const map = svg('svg', { viewBox: '0 0 960 480', role: 'application', tabindex: '0', 'aria-label': 'World map. Arrow keys move crosshair by two degrees. Enter places a guess pin.', 'data-testid': 'gg-map' });
  const projection = geoEquirectangular().scale(960 / (2 * Math.PI)).translate([480, 240]); const path = geoPath(projection);
  for (const f of countryFeatures) map.append(svg('path', { d: path(f), class: 'gg-land' }));
  const cross = svg('circle', { cx: 480, cy: 240, r: 8, class: 'gg-crosshair' }); map.append(cross);
  const pin = svg('circle', { cx: 0, cy: 0, r: 7, class: 'gg-pin', 'data-testid': 'gg-pin', visibility: 'hidden' }); map.append(pin);
  const confirm = button('Confirm guess', 'gg-confirm', () => finish(guess, false)); confirm.disabled = true;
  function place(lat, lon) { guess = { lat, lon }; const [x, y] = projection([lon, lat]); pin.setAttribute('cx', x); pin.setAttribute('cy', y); pin.setAttribute('visibility', 'visible'); confirm.disabled = false; }
  map.addEventListener('click', e => { if (status !== 'playing') return; const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(map.getScreenCTM().inverse()); const x = Math.max(0, Math.min(960, point.x)); const y = Math.max(0, Math.min(480, point.y)); place(90 - y / 480 * 180, x / 960 * 360 - 180); cross.setAttribute('cx', x); cross.setAttribute('cy', y); });
  map.addEventListener('keydown', e => { const delta = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, 2], ArrowDown: [0, -2] }[e.key]; if (delta) { e.preventDefault(); const lon = Math.max(-180, Math.min(180, Number(cross.getAttribute('cx')) / 960 * 360 - 180 + delta[0])); const lat = Math.max(-90, Math.min(90, 90 - Number(cross.getAttribute('cy')) / 480 * 180 + delta[1])); const [x, y] = projection([lon, lat]); cross.setAttribute('cx', x); cross.setAttribute('cy', y); } else if (e.key === 'Enter') { e.preventDefault(); place(90 - Number(cross.getAttribute('cy')) / 480 * 180, Number(cross.getAttribute('cx')) / 960 * 360 - 180); } });
  parent.append(map, confirm);
}
function renderOutline(parent) {
  const current = rounds[round]; const art = svg('svg', { viewBox: '0 0 480 290', role: 'img', 'aria-label': 'Unlabelled country silhouette', 'data-testid': 'gg-outline' });
  const projection = geoMercator().fitExtent([[20, 20], [460, 270]], current.feature); art.append(svg('path', { d: geoPath(projection)(current.feature), class: 'gg-silhouette' })); parent.append(art);
  const options = el('div', 'gg-options'); current.options.forEach((name, i) => { const b = button(name, `gg-option-${i + 1}`, () => finish(name, false)); options.append(b); }); parent.append(options);
  const keyboard = e => { if (status !== 'playing') { document.removeEventListener('keydown', keyboard); return; } if (/^[1-4]$/.test(e.key) && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); finish(current.options[Number(e.key) - 1], false); } };
  document.addEventListener('keydown', keyboard);
}
function finish(answer, timeout) {
  if (status !== 'playing') return; status = 'answered'; title();
  if (!defects.has('GG-BUG-2')) clearInterval(timer); else setTimeout(() => clearInterval(timer), 3000);
  const current = rounds[round]; let km = null, points = 0;
  if (mode === 'landmark' && answer) { km = haversine(answer.lat, answer.lon, current.lat, current.lon); /* A screen pixel spans tens of km on the world map; treat a within-pixel hit as exact. */ if (km <= 50) km = 0; points = landmarkPoints(defects.has('GG-BUG-1') && unit() === 'fahrenheit' ? km * 0.621371 : km); }
  if (mode === 'outline' && answer === current.answer) points = outlinePoints(timeLeft);
  score += points;
  results.push({ question: current.answer, answer: timeout ? 'Time expired' : mode === 'landmark' ? answer ? `${answer.lat.toFixed(1)}°, ${answer.lon.toFixed(1)}°` : '—' : answer, km, points, correct: answer === current.answer && mode === 'outline' });
  if (mode === 'landmark') {
    const map = root.querySelector('[data-testid="gg-map"]'), projection = geoEquirectangular().scale(960 / (2 * Math.PI)).translate([480, 240]); const [x, y] = projection([current.lon, current.lat]);
    if (answer) { const [gx, gy] = projection([answer.lon, answer.lat]); map.append(svg('line', { x1: gx, y1: gy, x2: x, y2: y, class: 'gg-answer-line' })); }
    map.append(svg('circle', { cx: x, cy: y, r: 8, class: 'gg-true-pin' }));
    root.querySelector('[data-testid="gg-confirm"]').disabled = true;
  } else root.querySelectorAll('.gg-options button').forEach(b => { b.disabled = true; if (b.textContent === current.answer) { b.classList.add('gg-correct'); b.setAttribute('aria-label', `${b.textContent} — correct`); } else if (b.textContent === answer) b.classList.add('gg-wrong'); });
  const panel = el('section', 'gg-feedback'); panel.dataset.testid = 'gg-feedback'; panel.setAttribute('aria-live', 'polite'); panel.append(el('h3', '', timeout ? "Time's up!" : points ? mode === 'outline' ? 'Correct!' : 'Guess recorded' : 'Not quite!'), el('p', '', `Correct answer: ${current.answer}`));
  if (mode === 'landmark') { const distance = el('p', '', km === null ? 'No distance — time expired' : `Distance: ${displayDistance(km, unit())}`); distance.dataset.testid = 'gg-distance'; panel.append(distance); }
  const earned = el('strong', '', `${points} points`); earned.dataset.testid = 'gg-points'; panel.append(earned, button(round === ROUNDS - 1 ? 'See results' : 'Next round', 'gg-next', () => { round++; round === ROUNDS ? showResults() : play(); })); root.append(panel); panel.querySelector('button').focus();
}
function showResults() {
  status = 'finished'; title(); root.replaceChildren(); const section = el('section', 'gg-results'); section.dataset.testid = 'gg-results'; section.append(el('p', 'eyebrow', `${mode === 'landmark' ? 'Landmark Pin' : 'Country Outline'} · Seed ${seed}`), el('h1', '', 'Your GeoGuess results'));
  const total = el('p', 'gg-grand-total', `${score} points`); total.dataset.testid = 'gg-total'; section.append(total);
  if (score > board.best[mode]) { board.best[mode] = score; saveBoard(); const best = el('p', 'gg-best', 'New best!'); best.dataset.testid = 'gg-new-best'; section.append(best); }
  section.append(el('p', '', `Best score: ${board.best[mode]}`));
  const table = el('table', 'gg-table'); table.dataset.testid = 'gg-breakdown'; const head = el('thead'); const header = el('tr'); ['Round', 'Question', 'Your answer', mode === 'landmark' ? 'Distance' : 'Correct?', 'Points'].forEach(h => header.append(el('th', '', h))); head.append(header); table.append(head); const body = el('tbody'); results.forEach((r, i) => { const tr = el('tr'); [i + 1, r.question, r.answer, mode === 'landmark' ? r.km === null ? '—' : displayDistance(r.km, unit()) : r.correct ? 'Yes' : 'No', r.points].forEach(v => tr.append(el('td', '', String(v)))); body.append(tr); }); table.append(body); const wrap = el('div', 'gg-table-wrap'); wrap.append(table); section.append(wrap);
  const actions = el('div', 'gg-actions'); actions.append(button('Play again (same game)', 'gg-replay', () => start(mode)), button('New game', 'gg-new', () => start(mode, false)), button('Copy share link', 'gg-share', async () => { const url = link(true).href; const message = root.querySelector('#gg-share-status'); try { await navigator.clipboard.writeText(url); message.textContent = 'Link copied'; } catch { message.textContent = 'Copy this link:'; const input = el('input'); input.type = 'text'; input.value = url; input.readOnly = true; input.setAttribute('aria-label', 'Share link'); message.append(input); input.select(); } })); const share = el('p'); share.id = 'gg-share-status'; share.setAttribute('role', 'status'); actions.append(share); section.append(actions);
  const form = el('form', 'gg-save-form'); form.dataset.testid = 'gg-save-form'; const label = el('label', '', 'Save score under your name'); label.htmlFor = 'gg-name'; const name = el('input'); name.id = 'gg-name'; name.dataset.testid = 'gg-name'; name.maxLength = 30; name.autocomplete = 'nickname'; const error = el('p'); error.dataset.testid = 'gg-name-error'; error.setAttribute('role', 'alert'); const save = button('Save score', 'gg-save', () => {}); save.type = 'submit'; form.append(label, name, error, save);
  form.addEventListener('submit', e => { e.preventDefault(); const value = name.value.trim(); if (value.length < 2 || value.length > 20) error.textContent = 'Name must be 2-20 characters'; else if (!/^[A-Za-z0-9 ]+$/.test(value)) error.textContent = 'Only letters, numbers and spaces'; else if (board.leaderboard[mode].some(r => r.seed === seed && r.name.toLowerCase() === value.toLowerCase())) error.textContent = 'Score already saved'; else { const entry = { name: value, score, date: new Date().toISOString(), seed }; board.leaderboard[mode] = leaderboardInsert(board.leaderboard[mode], entry); if (saveBoard()) { error.textContent = ''; highlighted = entry; renderLeaderboard(); } else error.textContent = 'Scores cannot be saved in this browser.'; } }); section.append(form); root.append(section); renderLeaderboard();
}
function renderLeaderboard() {
  root.querySelector('.gg-leaderboard-section')?.remove(); const section = el('section', 'gg-leaderboard-section detail-panel'); section.append(el('h2', '', 'Local top 10'));
  let tab = mode ?? 'landmark'; const tabs = el('div', 'gg-tabs'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Leaderboard mode');
  const table = el('table', 'gg-table'); table.dataset.testid = 'gg-leaderboard';
  function draw() { tabs.replaceChildren(); for (const m of ['landmark', 'outline']) { const b = el('button', '', m === 'landmark' ? 'Landmark Pin' : 'Country Outline'); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(m === tab)); b.addEventListener('click', () => { tab = m; draw(); }); tabs.append(b); } table.replaceChildren(); const header = el('tr'); ['Rank', 'Name', 'Score', 'Date'].forEach(t => header.append(el('th', '', t))); const thead = el('thead'); thead.append(header); table.append(thead); const body = el('tbody'); board.leaderboard[tab].forEach((entry, i) => { const tr = el('tr'); if (entry === highlighted) tr.classList.add('gg-highlight'); [i + 1, entry.name, entry.score, entry.date.slice(0, 10)].forEach(v => tr.append(el('td', '', String(v)))); body.append(tr); }); table.append(body); if (!body.children.length) { const tr = el('tr'), td = el('td', '', 'No saved scores yet.'); td.colSpan = 4; tr.append(td); body.append(tr); } }
  draw(); section.append(tabs); const wrap = el('div', 'gg-table-wrap'); wrap.append(table); section.append(wrap);
  const clear = button('Clear leaderboard', 'gg-clear', () => { const dialog = el('div', 'gg-confirm-dialog'); dialog.setAttribute('role', 'alertdialog'); dialog.setAttribute('aria-label', 'Confirm leaderboard clear'); dialog.append(el('p', '', `Clear the ${tab === 'landmark' ? 'Landmark Pin' : 'Country Outline'} leaderboard and best score?`)); const cancel = button('Cancel', 'gg-cancel-clear', () => { dialog.remove(); clear.focus(); }); dialog.append(cancel, button('Clear scores', 'gg-confirm-clear', () => { board.leaderboard[tab] = []; board.best[tab] = 0; saveBoard(); dialog.remove(); renderLeaderboard(); root.querySelector('[data-testid="gg-clear"]').focus(); })); section.append(dialog); cancel.focus(); dialog.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); cancel.click(); } }); }); section.append(clear); root.append(section);
}
document.querySelector('#gg-theme').addEventListener('click', () => { const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; try { localStorage.setItem('earthscope:theme:v1', JSON.stringify(next)); } catch {} });
initBugMode();
if (import.meta.env.DEV) window.__geoguess = { getState: () => ({ mode, seed, round: round + 1, totalRounds: ROUNDS, score, status, timeLeft }), getRounds: () => rounds.map(r => ({ id: r.id, answer: r.answer, lat: r.lat, lon: r.lon, options: r.options })), toScreen(lat, lon) { const map = root.querySelector('[data-testid="gg-map"]'); const p = new DOMPoint((lon + 180) / 360 * 960, (90 - lat) / 180 * 480).matrixTransform(map.getScreenCTM()); return { x: p.x, y: p.y }; } };
if (mode) updateUrl(params.get('start') === '1');
else { const url = new URL(location.href); url.searchParams.set('seed', String(seed)); history.replaceState(null, '', url); }
if (mode && params.get('start') === '1') start(mode); else selectScreen();


