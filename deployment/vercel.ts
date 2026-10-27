import { createApp } from '../api/app.ts';

// A single Node function retains the existing API and secure cookie contracts.
// Timers are not scheduled here: hosted alerts use the authenticated cron route.
export default createApp({ env: 'production', fixtures: false });
