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
