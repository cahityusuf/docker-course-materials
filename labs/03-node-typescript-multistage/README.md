# Lab 3 — Node.js + TypeScript Multi-Stage (Modül 6)

Üç aşamalı (deps → build → runtime) Node.js multi-stage build örneği.

## Dosyalar
- `package.json` — TypeScript devDependency olarak
- `tsconfig.json` — TS derleme ayarları
- `src/server.ts` — TypeScript HTTP sunucusu
- `Dockerfile` — 3 aşamalı

## Çalıştırma

```bash
cd node-typescript-multistage

# 1. Build et
docker build -t lab/node-ts:1.0 .

# 2. Çalıştır
docker run -d --name ts1 -p 8080:3000 lab/node-ts:1.0

# 3. Test
curl http://localhost:8080
curl http://localhost:8080/health

# 4. İmajda TypeScript derleyicisi VAR mı? (olmamalı!)
docker exec ts1 ls node_modules | grep -i typescript
# Çıktı boş olmalı - typescript devDependency, prune ile atıldı

# 5. dist klasörü görünüyor mu?
docker exec ts1 ls -la dist/
# server.js olmalı (kompile edilmiş)

# 6. src klasörü VAR mı? (olmamalı!)
docker exec ts1 ls -la 2>/dev/null | grep src
# Çıktı boş olmalı - src/ runtime'a kopyalanmadı

# 7. İmaj boyutu
docker images lab/node-ts:1.0
# ~180-220 MB civarı (Node + production deps + dist)

# 8. Karşılaştırma için tek aşamalı versiyonunu da düşünün:
# eğer 'docker build --target build -t lab/node-ts:withbuild .' yapsaydık ~350 MB+ olurdu
# Çünkü TypeScript, @types/node ve tüm devDependencies imajda kalırdı.

# Temizlik
docker stop ts1 && docker rm ts1
```

## Anlatılması gereken kavramlar

**Üç aşamanın görevleri:**
1. **deps** — `package.json`'dan tüm bağımlılıkları (dev + prod) kurar. Bu katman cache'lenir; sadece package.json değiştiğinde yeniden çalışır.
2. **build** — TypeScript'i JavaScript'e derler, sonra `npm prune --omit=dev` ile devDependencies'i atar.
3. **runtime** — Temiz Node base imajına yalnızca `dist/`, `node_modules/`, ve `package.json` kopyalanır. TypeScript derleyicisi, kaynak kod, test araçları imajda yer almaz.

**Neden bu kadar uğraş?**
- Saldırı yüzeyi minimize edilir (TS, eslint, jest gibi araçlar production imajında olmaz).
- İmaj küçülür, deploy hızlanır.
- Kaynak kod imaja sızmaz (legal/IP açısından önemli olabilir).

**`npm prune --omit=dev`** komutu sihirbazdır — `node_modules`'u in-place günceller, sadece production deps'lerini bırakır.
