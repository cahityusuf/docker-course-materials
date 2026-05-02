# Lab 2 — Go Multi-Stage Build (Modül 6)

Multi-stage build'in gücünü gözünüzle görmek için ideal örnek.

## Dosyalar
- `main.go` — standart kütüphane HTTP sunucusu
- `go.mod` — Go modül tanımı (external dep yok)
- `Dockerfile` — iki aşamalı (builder + runtime)
- `.dockerignore`

## Çalıştırma

```bash
cd go-multistage

# 1. Build (ilk seferinde Go toolchain indireceği için 1-2 dk sürer)
docker build -t lab/go-app:1.0 .

# 2. Sadece builder aşamasını da görmek isterseniz (debug için)
docker build --target builder -t lab/go-app:debug .

# 3. Çalıştır
docker run -d --name go1 -p 8080:8080 lab/go-app:1.0

# 4. Test et
curl http://localhost:8080
curl http://localhost:8080/health

# 5. İmaj boyutlarını karşılaştırın - bu en güzel kısmı!
docker images | grep lab/go-app
# lab/go-app:debug  →  ~350 MB  (Go toolchain + kaynak kod)
# lab/go-app:1.0    →  ~10 MB   (sadece statik binary)

# 6. Katmanları görelim
docker history lab/go-app:1.0
# Sadece distroless base + binary kopyalama görmelisiniz

# 7. Container içine giremezsiniz! (distroless'ta shell yok)
docker exec -it go1 sh
# OCI runtime exec failed: ... "sh": executable file not found

# Bu güvenlik için iyidir; ama debug zorlaşır.
# Debug gerekiyorsa runtime imajını "distroless:debug" tag'iyle değiştirin.

# 8. Temizlik
docker stop go1 && docker rm go1
docker rmi lab/go-app:1.0 lab/go-app:debug
```

## Anlatılması gereken kavramlar

**`CGO_ENABLED=0`**: Go'nun C kodu çağırma yeteneğini kapatır. Sonuç: tamamen statik binary üretilir, ne libc ne başka bir kütüphane bağımlılığı kalır. Bu sayede `distroless/static` gibi neredeyse boş bir imaja koyabiliriz.

**`-ldflags='-s -w'`**: Debug sembollerini ve DWARF tablolarını atar. Binary boyutunu %25-30 azaltır.

**`distroless`**: Google'ın hazırladığı, sadece uygulamanın gerçekten ihtiyacı olan dosyaları içeren imaj. Shell, paket yöneticisi, ls/cat gibi araçlar yok. Saldırı yüzeyi minimum.

**`nonroot` varyantı**: Distroless'in `:nonroot` sonekli versiyonunda UID 65532 tanımlı; `USER nonroot:nonroot` ile direkt kullanılır.
