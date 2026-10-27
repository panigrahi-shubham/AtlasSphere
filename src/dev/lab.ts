const $ = (id: string) => document.getElementById(id)!;
$('scenario-run').addEventListener('click', async () => {
  $('scenario-result').textContent = 'Loading scenario…';
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 1000);
  try {
    const response = await fetch(`/api/v1/test-lab/scenario?failure=${encodeURIComponent(($('failure') as HTMLSelectElement).value)}`, { headers: { 'x-skyatlas-defects': ($('scenario') as HTMLSelectElement).value }, signal: controller.signal });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Scenario unavailable.');
    $('scenario-result').textContent = JSON.stringify(data, null, 2);
  } catch (error: any) { $('scenario-result').textContent = `${error.name === 'AbortError' ? 'Timed out' : error.message}. Choose normal and retry.`; }
  finally { clearTimeout(timer); }
});
$('dialog-alert').addEventListener('click', () => alert('Practice alert'));
$('dialog-confirm').addEventListener('click', () => { $('dialog-result').textContent = confirm('Confirm action?') ? 'Confirmed' : 'Cancelled'; });
$('dialog-prompt').addEventListener('click', () => { $('dialog-result').textContent = prompt('Enter a name') || 'No answer'; });
$('open-shadow').attachShadow({ mode: 'open' }).innerHTML = '<button type="button">Open shadow button</button>';
$('closed-shadow').attachShadow({ mode: 'closed' }).innerHTML = '<button type="button">Closed shadow button</button>';
$('open-shadow').shadowRoot!.querySelector('button')!.addEventListener('click', () => { $('shadow-result').textContent = 'Open shadow clicked'; });
// A closed root is intentionally opaque to test code: only the user-visible effect is asserted.
const closed = $('closed-shadow');
closed.addEventListener('click', () => { $('shadow-result').textContent = 'Closed shadow clicked'; });
$('lab-upload').addEventListener('change', () => { $('upload-result').textContent = `Selected ${($('lab-upload') as HTMLInputElement).files?.[0]?.name || 'no file'}`; });
$('lab-download').addEventListener('click', () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['SkyAtlas Test Lab\n'], { type: 'text/plain' })); a.download = 'skyatlas-lab.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); });
$('drag-item').addEventListener('dragstart', e => (e as DragEvent).dataTransfer!.setData('text/plain', 'card'));
$('drop-zone').addEventListener('dragover', e => e.preventDefault());
$('drop-zone').addEventListener('drop', e => { e.preventDefault(); $('drop-zone').textContent = (e as DragEvent).dataTransfer!.getData('text/plain') === 'card' ? 'Card dropped' : 'Unknown item'; });
let rows = 0;
$('add-row').addEventListener('click', () => { const tr = document.createElement('tr'); const number = document.createElement('td'), state = document.createElement('td'); number.textContent = String(++rows); state.textContent = 'Ready'; tr.append(number, state); $('dynamic-rows').append(tr); });
let loaded = 0;
function append() { const box = $('scroll-list'); for (let i = 0; i < 10; i++) { const p = document.createElement('p'); p.textContent = `Item ${++loaded}`; box.append(p); } }
append();$('scroll-list').addEventListener('scroll', () => { const box = $('scroll-list'); if (box.scrollTop + box.clientHeight >= box.scrollHeight - 20 && loaded < 100) append(); });
$('toast-button').addEventListener('click', () => { $('toast').hidden = false; $('toast').textContent = 'Action complete'; setTimeout(() => { $('toast').hidden = true; }, 1800); });
