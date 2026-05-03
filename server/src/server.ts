import { env } from './config/env';
import { app } from './app';

const PORT = Number(env.PORT);

app.listen(PORT, () => {
  console.log(`[server] Running on http://localhost:${PORT}`);
  console.log(`[server] Environment: ${env.NODE_ENV}`);
});
