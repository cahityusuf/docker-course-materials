// Modül 6 - TypeScript HTTP sunucusu (multi-stage build içindir)

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { hostname } from 'os';

const PORT: number = Number(process.env.PORT) || 3000;
const ENV: string = process.env.NODE_ENV || 'development';

interface HealthResponse {
  status: 'ok' | 'degraded';
  uptime: number;
  hostname: string;
}

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  if (req.url === '/health') {
    const body: HealthResponse = {
      status: 'ok',
      uptime: process.uptime(),
      hostname: hostname(),
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(
    `Merhaba TypeScript + Docker!\n` +
      `Ortam        : ${ENV}\n` +
      `Hostname     : ${hostname()}\n` +
      `Node sürümü  : ${process.version}\n`
  );
});

server.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] TS sunucu ${PORT} portunda dinliyor (env=${ENV})`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM alındı, kapatılıyor...');
  server.close(() => process.exit(0));
});
