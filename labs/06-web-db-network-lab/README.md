# Lab 6 — Web + DB İki Container Haberleşme (Modül 8)

İki container'ı kendi oluşturduğumuz ağa bağlayıp **isimle DNS çözümlemesini** kanıtlayacağız.

## Senaryo

`db` adında bir PostgreSQL ve `web` adında bir nginx container'ı çalıştıracağız. Web, db'ye **IP yerine "db" ismiyle** bağlanabilecek.

## Adım adım

```bash
# 1. Custom bridge ağı oluştur (default bridge'te DNS YOK!)
docker network create app-net
docker network inspect app-net

# 2. PostgreSQL'i bu ağa bağla
docker run -d --name db --network app-net \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=myapp \
  postgres:16-alpine

# 3. nginx'i AYNI ağa bağla
docker run -d --name web --network app-net -p 8080:80 \
  nginx:1.27-alpine

# 4. web içinden db'yi ismiyle çöz - işte sihir!
docker exec web getent hosts db
# çıktı: 172.18.0.2 db
# Docker built-in DNS, "db" ismini IP'ye çevirdi

# 5. nginx'in içine psql client kuralım ve gerçekten bağlanalım
docker exec web sh -c "apk add --no-cache postgresql-client"
docker exec web sh -c "PGPASSWORD=secret psql -h db -U postgres -d myapp -c 'SELECT version();'"
# PostgreSQL 16.x ... çıktısı gelmelidir

# 6. KARŞILAŞTIRMA - default bridge'te aynı şey çalışır mı?
docker run -d --name db-default \
  -e POSTGRES_PASSWORD=secret postgres:16-alpine

docker run -d --name web-default nginx:1.27-alpine

docker exec web-default getent hosts db-default
# Çıktı yok! Default bridge'te container'lar birbirini isimle bulamaz
# (Sadece IP ile, ki o da değişebilir)

# Temizlik (default bridge testi)
docker rm -f db-default web-default

# 7. İki container'ı birbirinden gör - tcpdump örneği
# (netshoot debug imajı host network namespace'ine girer)
docker run --rm --network container:web nicolaka/netshoot ping -c 3 db

# 8. Ağdan bir container'ı çıkar
docker network disconnect app-net web
docker exec web getent hosts db || echo "Artik gormiyor"

# Geri ekle
docker network connect app-net web
docker exec web getent hosts db    # tekrar görür

# 9. Internal network örneği - DB'yi dış dünyadan tamamen gizle
docker network create --internal db-net
docker network connect db-net db

# Şimdi db, hem app-net'te hem db-net'te
# app-net iletişim yapabilir, db-net dış dünyaya çıkamaz
docker network inspect db-net

# 10. Temizlik
docker rm -f web db
docker network rm app-net db-net
```

## Anlatılması gereken kavramlar

**Default bridge ≠ user-defined bridge:**

| | Default bridge | User-defined bridge |
|---|---|---|
| Otomatik DNS | YOK | VAR (container ismiyle çözüm) |
| İzolasyon | Tüm container'lar aynı | Her ağ ayrı broadcast domain |
| `--link` ile eski yöntem | Gerekiyor (deprecated) | Hiç gerek yok |
| Üretimde tercih | Asla | Her zaman |

**Port publishing nüansı:**
- `-p 8080:80` → 0.0.0.0 üzerinden, dış dünyaya açık (DİKKAT!)
- `-p 127.0.0.1:8080:80` → sadece localhost'tan erişilir
- `-p 8080:80/udp` → UDP için
- `db` container'ında `-p` YOK; çünkü dış dünyaya açmaya gerek yok, sadece `web` ona iç ağdan erişiyor

**Internal network (`--internal`):**
DB gibi servisleri internal ağa koyarsanız o ağdaki hiçbir container internete çıkamaz. Sadece app sunucusu hem internal hem external ağda olur, db'ye köprü görevi görür. Klasik 3-tier mimari pattern'i.

**Production'da Compose ile:**
Tüm bu manuel network create + run komutları yerine `compose.yaml` kullanılır:

```yaml
services:
  web:
    image: nginx:1.27-alpine
    ports: ["8080:80"]
    networks: [frontend, backend]
    depends_on: [db]
  db:
    image: postgres:16-alpine
    environment: [POSTGRES_PASSWORD=secret]
    networks: [backend]   # frontend'de YOK - dış dünyaya hiç görünmez

networks:
  frontend:
  backend:
    internal: true
```

`docker compose up -d` ile her şey otomatik kurulur. Compose, `webdb_backend` gibi proje ön-ekli ağ isimleri yaratır.
