let accessToken = '';
let currentUser = null;
let wakingRequests = 0;
function showWakeStatus() {
  const status = document.querySelector('#server-wake-status');
  if (status) status.hidden = wakingRequests === 0;
}
export const account = {
  get user() { return currentUser; },
  get signedIn() { return Boolean(accessToken); },
  async request(path, options = {}) {
    const headers = { 'content-type': 'application/json', ...options.headers };
    if (accessToken) headers.authorization = `Bearer ${accessToken}`;
    let waking = false;
    const wakeTimer = setTimeout(() => { if (!waking) { waking = true; wakingRequests++; showWakeStatus(); } }, 1500);
    try {
      for (let attempt = 0; ; attempt++) {
        const response = await fetch(`/api/v1${path}`, { ...options, headers, credentials: 'same-origin' });
        if (response.status === 503 && response.headers.has('Retry-After')) {
          const safe = (options.method || 'GET').toUpperCase() === 'GET' || response.headers.get('X-SkyAtlas-Retry-Safe') === '1';
          if (!safe) throw new Error('The server response was interrupted. Check whether your change was saved before trying again.');
          if (attempt >= 3) throw new Error('Waking up the AtlasSphere server. Try again in a moment.');
          if (!waking) { waking = true; wakingRequests++; showWakeStatus(); }
          const seconds = Number(response.headers.get('Retry-After'));
          await new Promise(resolve => setTimeout(resolve, (Number.isFinite(seconds) ? Math.max(0, Math.min(seconds, 20)) : 2) * 1000));
          continue;
        }
        if (response.status === 204) return null;
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'Request failed.');
        return data;
      }
    } finally { clearTimeout(wakeTimer); if (waking) { wakingRequests--; showWakeStatus(); } }
  },
  async refresh() {
    try {
      const data = await this.request('/auth/refresh', { method: 'POST' });
      accessToken = data.accessToken; currentUser = data.user;
      dispatchEvent(new Event('skyatlas-account-changed'));
      return data.user;
    } catch { accessToken = ''; currentUser = null; return null; }
  },
  async signIn(path, email, password) {
    const data = await this.request(path, { method: 'POST', body: JSON.stringify({ email, password }) });
    accessToken = data.accessToken; currentUser = data.user;
    dispatchEvent(new Event('skyatlas-account-changed'));
    return data.user;
  },
  async logout() {
    try { await this.request('/auth/logout', { method: 'POST' }); } finally {
      accessToken = ''; currentUser = null; dispatchEvent(new Event('skyatlas-account-changed'));
    }
  },
  forget() {
    accessToken = ''; currentUser = null; dispatchEvent(new Event('skyatlas-account-changed'));
  }
};
