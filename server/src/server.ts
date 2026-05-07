import { env } from './config/env';
import { initDb } from './config/db';
import { app } from './app';

const PORT = Number(env.PORT);

initDb();

app.listen(PORT, () => {
  console.log(`[server] Running on http://localhost:${PORT}`);
  console.log(`[server] Environment: ${env.NODE_ENV}`);
});
