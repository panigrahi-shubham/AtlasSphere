

/** Upgrade the page shell without replacing the legacy feature DOM or test IDs. */
export function initSiteShell() {
  if (document.getElementById('atlas-navigation-dialog')) return;
  const links = [
    ['Home', '/'], ['Explore Earth', '/explore.html'], ['World Atlas', '/explore.html#atlas-section'],
    ['Countries', '/explore.html#country-directory'], ['Natural Wonders', '/explore.html#landmarks-worldwide'],
    ['Explore Space', '/#universe'], ['Solar System', '/universe/solar-system'], ['Earth Science', '/#earth-science'], ['History', '/#history'],
    ['Weather', '/explore.html#city'], ['GeoGuess', '/geoguess'], ['Journeys', '/journeys'],
    ['Learning Hub', '/#learning'], ['Account', '/explore.html#account-section'], ['About', '/about.html'], ['Data Sources', '/sources'],
  ];
  let toggle = document.querySelector<HTMLButtonElement>('#menu-toggle');
  if (!toggle) {
    let header = document.querySelector<HTMLElement>('body > header.site-header');
    if (!header) {
      header = document.createElement('header');
      header.className = 'atlas-legacy-header';
      header.innerHTML = '<a class="brand" href="/">◉ AtlasSphere</a>';
      document.body.prepend(header);
    }
    toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.textContent = '☰ Menu';
    toggle.dataset.testid = 'site-menu-toggle';
    header.append(toggle);
  }
  const trigger = toggle;
  trigger.setAttribute('aria-label', 'Open navigation menu');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'atlas-navigation-dialog');
  const dialog = document.createElement('dialog');
  dialog.id = 'atlas-navigation-dialog';
  dialog.className = 'atlas-drawer';
  dialog.dataset.testid = 'site-navigation-dialog';
  dialog.setAttribute('aria-labelledby', 'atlas-navigation-title');
  dialog.innerHTML = '<div class="atlas-drawer-top"><h2 id="atlas-navigation-title">Follow your curiosity</h2><button type="button" data-testid="site-menu-close">Close menu</button></div>';
  const existingNav = document.querySelector<HTMLElement>('#explore-nav');
  const originalPosition = document.createComment('Existing explorer navigation');
  existingNav?.before(originalPosition);
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'AtlasSphere destinations');
  for (const [label, href] of links) {
    if (existingNav && [...existingNav.querySelectorAll('a')].some(a => a.getAttribute('href') === href)) continue;
    const a = document.createElement('a'); a.href = href; a.textContent = label; nav.append(a);
  }
  dialog.append(nav);
  document.body.append(dialog);
  let previousOverflow = '';
  const close = () => {
    dialog.close(); trigger.setAttribute('aria-expanded', 'false');
    if (existingNav) { existingNav.dataset.open = 'false'; originalPosition.after(existingNav); }
    document.body.style.overflow = previousOverflow; trigger.focus();
  };
  trigger.addEventListener('click', () => {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; trigger.setAttribute('aria-expanded', 'true');
    if (existingNav) { existingNav.dataset.open = 'true'; nav.before(existingNav); }
    dialog.showModal();
  });
  dialog.querySelector('button')!.addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('click', event => { if (event.target === dialog || (event.target as Element).closest('a')) close(); });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const items = [...dialog.querySelectorAll<HTMLElement>('a[href],button')];
    const first = items[0], last = items.at(-1)!;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  if (!document.querySelector('#theme-toggle, #gg-theme')) {
    const theme = document.createElement('button'); theme.type = 'button'; theme.textContent = 'Switch theme'; theme.dataset.testid = 'site-theme-toggle';
    const update = () => { theme.setAttribute('aria-pressed', String(document.documentElement.dataset.theme === 'light')); };
    try { const saved: unknown = JSON.parse(localStorage.getItem('earthscope:theme:v1') ?? 'null'); if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved; } catch { /* Session theme is still usable. */ }
    update();
    theme.addEventListener('click', () => { const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'; document.documentElement.dataset.theme = next; update(); try { localStorage.setItem('earthscope:theme:v1', JSON.stringify(next)); } catch { theme.title = 'Preference applies to this visit only.'; } });
    trigger.before(theme);
  }
  const footer = document.createElement('footer'); footer.className = 'atlas-legacy-footer';
  footer.innerHTML = '<strong>AtlasSphere · Explore Earth and Beyond</strong><a href="/sources">Sources</a><a href="/privacy">Privacy</a><a href="/accessibility">Accessibility</a><a href="https://open-meteo.com/">Weather data by Open-Meteo.com</a>';
  document.body.append(footer);
}

initSiteShell();
