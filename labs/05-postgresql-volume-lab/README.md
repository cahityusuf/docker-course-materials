# Lab 5 — PostgreSQL Veri Kalıcılığı (Modül 7)

Container silinince verinin kaybolmadığını **kendi gözünüzle** görmek için.

Hazırlanmış kod yok; resmi `postgres:16-alpine` imajını kullanıyoruz.

## Senaryo

Bir DB container'ı oluşturacağız, içine veri yazacağız, container'ı SİLECEĞİZ, sonra aynı volume'ü yeni bir container'a bağlayıp verinin hâlâ orada olduğunu göstereceğiz.

## Adım adım

```bash
# 1. Volume oluştur
docker volume create pgdata
docker volume inspect pgdata
# Mountpoint host'ta /var/lib/docker/volumes/pgdata/_data altında

# 2. PostgreSQL container'ını volume bağlı şekilde çalıştır
docker run -d --name pg \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=mydb \
  -v pgdata:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:16-alpine

# 3. Sağlıklı olmasını bekle (10 sn)
docker logs pg | tail -5

# 4. İçeri gir, tablo oluştur ve veri yaz
docker exec -it pg psql -U postgres -d mydb -c "
  CREATE TABLE musteriler (id SERIAL PRIMARY KEY, ad TEXT, kayit_zamani TIMESTAMP DEFAULT NOW());
  INSERT INTO musteriler (ad) VALUES ('Ali'), ('Ayse'), ('Mehmet');
  SELECT * FROM musteriler;
"

# 5. ŞİMDİ KRİTİK ANI - container'ı sil
docker rm -f pg
docker ps -a | grep pg    # gerçekten silindi

# 6. Aynı volume'ü yeni bir container'a bağla
docker run -d --name pg2 \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=mydb \
  -v pgdata:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:16-alpine

# 7. Veri hâlâ orada mı?
sleep 5
docker exec -it pg2 psql -U postgres -d mydb -c "SELECT * FROM musteriler;"
# Üç müşteri kaydı hâlâ orada!

# 8. Backup al
docker run --rm \
  -v pgdata:/data:ro \
  -v $(pwd):/backup \
  alpine tar czf /backup/pgdata-backup.tar.gz -C /data .
ls -lh pgdata-backup.tar.gz

# 9. Volume'ün host'ta nerede olduğunu görelim (Linux'ta)
docker volume inspect pgdata --format '{{.Mountpoint}}'

# 10. Tam temizlik
docker rm -f pg2
docker volume rm pgdata
rm pgdata-backup.tar.gz
```

## Karşılaştırma — VOLUME OLMASAYDI ne olurdu?

```bash
# Volume'süz
docker run -d --name pg-bad -e POSTGRES_PASSWORD=secret postgres:16-alpine
docker exec -it pg-bad psql -U postgres -c "CREATE DATABASE x; \\l"
docker rm -f pg-bad

docker run -d --name pg-bad2 -e POSTGRES_PASSWORD=secret postgres:16-alpine
sleep 5
docker exec -it pg-bad2 psql -U postgres -c "\\l"
# x veritabanı YOK - container silindiğinde gitti!

docker rm -f pg-bad2
```

**Ders:** Container'ın writable layer'ı container ile birlikte ölür. Veri kalıcılığı isteyen her şey **mutlaka** volume veya bind mount kullanmalıdır.

## Bind mount alternatifi (geliştirme için)

```bash
# Host'taki bir dizinden mount et
mkdir -p $(pwd)/postgres-data
docker run -d --name pg3 \
  -e POSTGRES_PASSWORD=secret \
  -v $(pwd)/postgres-data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:16-alpine

# Host'taki dosyaları görebilirsiniz (Linux)
ls -la $(pwd)/postgres-data/

# Avantaj: dosyalara host'tan doğrudan erişim
# Dezavantaj: macOS/Windows'ta performans düşük olabilir, izin sorunları çıkabilir
```
