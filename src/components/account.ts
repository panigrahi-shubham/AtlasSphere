import { account } from '../services/account.ts';

export function initAccount() {
  const root = document.querySelector('#account-section');
  if (!root) return;
  const message = root.querySelector('#account-status');
  const accountInfo = root.querySelector('#account-info');
  const form = root.querySelector('#account-form');
  const submit = root.querySelector('#account-submit');
  let mode = 'login';
  function update() {
    accountInfo.hidden = !account.signedIn;
    form.hidden = account.signedIn;
    root.querySelector('#account-email-display').textContent = account.user?.email || '';
    root.querySelector('#profile-name').value = account.user?.displayName || '';
  }
  root.querySelector('#account-mode').addEventListener('click', () => {
    mode = mode === 'login' ? 'register' : 'login';
    submit.textContent = mode === 'register' ? 'Create account' : 'Sign in';
    root.querySelector('#account-mode').textContent = mode === 'register' ? 'Have an account? Sign in' : 'Create an account';
    message.textContent = '';
  });
  form.addEventListener('submit', async event => {
    event.preventDefault(); submit.disabled = true; message.textContent = 'Working…';
    try {
      await account.signIn(`/auth/${mode}`, root.querySelector('#account-email').value, root.querySelector('#account-password').value);
      message.textContent = 'Signed in. Your favorites will sync.';
      form.reset(); update();
    } catch (error) { message.textContent = error.message; }
    finally { submit.disabled = false; }
  });
  root.querySelector('#account-signout').addEventListener('click', async () => {
    try { await account.logout(); message.textContent = 'Signed out. Your browser favorites remain available.'; }
    catch (error) { message.textContent = error.message; }
    update();
  });
  root.querySelector('#profile-form').addEventListener('submit', async event => {
    event.preventDefault();
    try { const result = await account.request('/account/profile', { method: 'PUT', body: JSON.stringify({ displayName: root.querySelector('#profile-name').value }) }); if (account.user) account.user.displayName = result.displayName; message.textContent = 'Display name saved.'; }
    catch (error) { message.textContent = error.message; }
  });
  root.querySelector('#account-export').addEventListener('click', async () => {
    try {
      const data = await account.request('/account/export');
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = `skyatlas-export-${new Date().toISOString().slice(0, 10)}.json`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000); message.textContent = 'Your data download is ready.';
    } catch (error) { message.textContent = error.message; }
  });
  const dialog = root.querySelector('#delete-account-dialog');
  root.querySelector('#account-delete').addEventListener('click', () => dialog.showModal());
  root.querySelector('#delete-account-cancel').addEventListener('click', () => dialog.close());
  root.querySelector('#delete-account-form').addEventListener('submit', async event => {
    event.preventDefault();
    const status = root.querySelector('#delete-account-status');
    try {
      await account.request('/account', { method: 'DELETE', body: JSON.stringify({ password: root.querySelector('#delete-account-password').value }) });
      event.target.reset(); dialog.close(); account.forget(); message.textContent = 'Your account was deleted.'; update();
    } catch (error) { status.textContent = error.message; }
  });
  root.querySelector('#reset-request').addEventListener('click', async () => {
    try { const result = await account.request('/auth/reset/request', { method: 'POST', body: JSON.stringify({ email: root.querySelector('#account-email').value }) }); message.textContent = result.message; }
    catch (error) { message.textContent = error.message; }
  });
  root.querySelector('#reset-form').addEventListener('submit', async event => {
    event.preventDefault();
    try {
      await account.request('/auth/reset/confirm', { method: 'POST', body: JSON.stringify({ email: root.querySelector('#account-email').value, code: root.querySelector('#reset-code').value, password: root.querySelector('#reset-password').value }) });
      message.textContent = 'Password changed. Sign in with the new password.';
      event.target.reset();
    } catch (error) { message.textContent = error.message; }
  });
  addEventListener('skyatlas-account-changed', update);
  update(); void account.refresh().then(update);
}
