// Modül 5 - Basit bir Node.js HTTP sunucusu
// Bağımsız (zero-dependency) çalışır; Express vs gerek yok.

const http = require('http');

const PORT = Number(process.env.PORT) || 3000;
const ENV = process.env.NODE_ENV || 'dev';

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(
    `Merhaba Docker!\n` +
    `Ortam        : ${ENV}\n` +
    `Hostname     : ${require('os').hostname()}\n` +
    `Node sürümü  : ${process.version}\n`
  );
});

server.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Sunucu ${PORT} portunda dinliyor (env=${ENV})`);
});

// Graceful shutdown - SIGTERM yakala (docker stop için kritik!)
process.on('SIGTERM', () => {
  console.log('SIGTERM alındı, kapatılıyor...');
  server.close(() => process.exit(0));
});
