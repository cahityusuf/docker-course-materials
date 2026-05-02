# Lab 1 — Node.js Basit (Modül 5)

Tek dosyalık bir HTTP sunucusunu Docker'da çalıştırma.

## Dosyalar
- `server.js` — bağımsız HTTP sunucu (Express vs gerek yok)
- `package.json` — script ve metadata
- `Dockerfile` — single-stage build
- `.dockerignore` — build context'ten dışlananlar

## Çalıştırma

```bash
# 1. Bu klasöre gidin
cd nodejs-basit

# 2. Image build edin
docker build -t lab/nodejs-basit:1.0 .

# 3. Container'ı arka planda çalıştırın
docker run -d --name web1 -p 8080:3000 -e NODE_ENV=production lab/nodejs-basit:1.0

# 4. Test edin
curl http://localhost:8080
curl http://localhost:8080/health

# 5. Logları izleyin
docker logs -f web1
# Ctrl+C ile bırak (container çalışmaya devam eder)

# 6. İçeri girin
docker exec -it web1 sh
ps aux         # PID 1 doğrudan node olmalı
exit

# 7. Healthcheck'i izleyin (30 sn bekleyin)
docker ps     # STATUS sütununda (healthy) yazmalı

# 8. Temizlik
docker stop web1 && docker rm web1
```

## Kontrol noktaları

- `docker images` çıktısında imaj boyutu ~150 MB civarı (alpine yüzünden küçük).
- `docker exec web1 whoami` "node" döner — root değil.
- `docker stop web1` 10 saniyeden kısa sürede bitmeli (SIGTERM düzgün yakalanıyor).
- Aynı imajdan ikinci container farklı portta açın: `docker run -d -p 8081:3000 lab/nodejs-basit:1.0` — image paylaşılır, container'lar bağımsız.
