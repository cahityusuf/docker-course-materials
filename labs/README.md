# Docker Kursu — Lab Uygulamaları (Gün 2)

Kursun 2. gününde işlenen tüm Dockerfile örneklerinin **çalışan, tam projeleri**.

Her klasörün içinde:
- Çalışacak gerçek kaynak kod
- Hazır `Dockerfile`
- `.dockerignore`
- Adım adım talimat veren `README.md`

## İçerik

| # | Klasör | Modül | Konu |
|---|---|---|---|
| 1 | `nodejs-basit/` | Modül 5 | Tek aşamalı Dockerfile, Node.js HTTP sunucusu |
| 2 | `go-multistage/` | Modül 6 | Multi-stage build → 10 MB distroless imaj |
| 3 | `node-typescript-multistage/` | Modül 6 | Üç aşamalı Node.js + TypeScript |
| 4 | `python-buildkit/` | Modül 6 | BuildKit `--mount=type=cache` ile Python/Flask |
| 5 | `postgresql-volume-lab/` | Modül 7 | Veri kalıcılığı kanıtlama (kod yok, README'de komutlar) |
| 6 | `web-db-network-lab/` | Modül 8 | Custom bridge + DNS + internal network |

## Kullanım

Her klasörün kendi `README.md`'si vardır. Tipik akış:

```bash
cd nodejs-basit          # veya başka bir lab klasörü
cat README.md            # adım adım talimatları okuyun
docker build -t lab/x .  # imajı build edin
docker run -d -p 8080:3000 lab/x  # çalıştırın
```

## Sıraya göre öneri

Sırasıyla yapın - her biri öncekinin üzerine kavramsal olarak inşa eder:

1. **`nodejs-basit/`** — Önce Dockerfile'ın temel yapısını içselleştirin
2. **`go-multistage/`** — Multi-stage build'in görsel sonucunu (10 MB!) görün
3. **`node-typescript-multistage/`** — Çok aşamalı build'in pratiğini deneyin
4. **`python-buildkit/`** — BuildKit özelliklerini öğrenin
5. **`postgresql-volume-lab/`** — Veri kalıcılığını kavrayın
6. **`web-db-network-lab/`** — Container'lar arası ağı kurun

## Önkoşullar

- Docker Engine 23.0 veya üstü kurulu (`docker --version`)
- BuildKit aktif (Docker 23+'da varsayılan; eski sürümlerde `export DOCKER_BUILDKIT=1`)
- İnternet bağlantısı (image'lar Docker Hub'dan ilk kez indirilecek)
- Lab 5 ve 6 için 5432, 8080 gibi portların müsait olması

## Genel temizlik

Tüm lab'ları bitirdikten sonra:

```bash
docker container prune -f                         # durmuş container'lar
docker image prune -a -f --filter "label=lab"     # lab/ prefixli image'lar
# veya daha agresif:
docker image prune -a -f
docker volume prune -f                            # kullanılmayan volume'ler
docker network prune -f                           # kullanılmayan ağlar
docker system df                                  # ne kadar disk geri kazanıldı
```

## Sorun giderme

**"port is already allocated"**: Aynı portu (8080) iki kez yayınlamaya çalıştınız. `docker ps` ile çakışan container'ı bulun veya `-p 8081:...` farklı port deneyin.

**"permission denied" (volume'de)**: Linux'ta UID uyumsuzluğu. `docker run -u $(id -u):$(id -g) ...` deneyin.

**Build çok yavaş (10+ dakika)**: `.dockerignore` çalışıyor mu? `du -sh .` ile build context boyutunu kontrol edin.

**"docker daemon not running"**: macOS/Windows'ta Docker Desktop'ı açın. Linux'ta `sudo systemctl start docker`.
