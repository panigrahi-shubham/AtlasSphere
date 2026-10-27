let accessToken = '';
let currentUser = null;
export const account = {
  get user() { return currentUser; },
  get signedIn() { return Boolean(accessToken); },
  async request(path, options = {}) {
    const headers = { 'content-type': 'application/json', ...options.headers };
    if (accessToken) headers.authorization = `Bearer ${accessToken}`;
    const response = await fetch(`/api/v1${path}`, { ...options, headers, credentials: 'same-origin' });
    if (response.status === 204) return null;
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Request failed.');
    return data;
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
