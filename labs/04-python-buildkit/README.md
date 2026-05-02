# Lab 4 — Python + BuildKit Cache Mount (Modül 6)

BuildKit'in `--mount=type=cache` özelliğiyle pip cache'ini build'ler arası kalıcı tutuyoruz.

## Dosyalar
- `app.py` — Flask web uygulaması
- `requirements.txt` — Python bağımlılıkları
- `Dockerfile` — BuildKit syntax direktifi ile

## Çalıştırma

```bash
cd python-buildkit

# 1. BuildKit aktif olmalı (Docker 23+'da varsayılan; eski sürümlerde):
export DOCKER_BUILDKIT=1

# 2. İlk build - pip paketleri internetten indirir (30-60 sn)
time docker build -t lab/python-app:1.0 .

# 3. requirements.txt'i AYNI tutup app.py'yi DEĞİŞTİRİN
echo "# yorum satiri" >> app.py

# 4. Tekrar build - pip cache'den gelir, çok hızlı (< 5 sn)!
time docker build -t lab/python-app:1.0 .

# 5. requirements.txt'i değiştirin (örn. flask sürümünü değiştirin)
# Bu kez bile cache'den ÖNCEDEN İNDİRİLMİŞ pakatleri kullanır
# (pip "already cached" der), gerçek indirme yine az olur

# 6. Çalıştırın
docker run -d --name py1 -p 8080:5000 lab/python-app:1.0
curl http://localhost:8080
curl http://localhost:8080/health

# 7. Logları izleyin (gunicorn access log'larını da görürsünüz)
docker logs -f py1

# 8. İçeri girin
docker exec -it py1 bash
whoami     # "app" yazmalı
ls -la /root/.cache/pip 2>/dev/null  # YOK olmalı! cache imaja yazılmadı
exit

# Temizlik
docker stop py1 && docker rm py1
```

## Anlatılması gereken kavramlar

**`# syntax=docker/dockerfile:1.7`** — BuildKit'in dockerfile frontend versiyonunu pin'ler. Bu satır olmadan `--mount` özellikleri çalışmaz.

**`--mount=type=cache,target=/root/.cache/pip`** — Build sırasında belirtilen path'e BuildKit-yönetimli kalıcı bir cache mount edilir. Bu cache:
- Build'ler arası saklanır (host'taki BuildKit cache deposunda)
- İmaja YAZILMAZ; final imaj boyutu artmaz
- Aynı host üzerindeki tüm build'ler arasında paylaşılır

**Gerçek pratik fayda:** CI'da bu sayede her PR build'i pip'i baştan indirmek yerine cache'den alır. `pip install` 60 sn'den 5 sn'ye düşer.

**Alternatif: secret mount** — Aynı sözdizimiyle private package registry token'ı geçirebilirsiniz:
```dockerfile
RUN --mount=type=secret,id=pypi_token \
    PIP_INDEX_URL=$(cat /run/secrets/pypi_token) pip install -r requirements.txt
```
Build komutu:
```bash
docker build --secret id=pypi_token,src=$HOME/.pypirc -t myapp .
```
