import { createApp } from './app.ts';
import { scheduleAlerts } from './alertWorker.ts';
process.env.APP_ENV ??= 'production';
const port = Number(process.env.PORT || 3000);
createApp().listen(port, '0.0.0.0', () => console.log(`SkyAtlas API listening on ${port}`));

scheduleAlerts();
