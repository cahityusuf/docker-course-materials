# Lab 7 — Fullstack Docker Compose Örneği

Production-yakını bir kurguyla **6 servisli** kapsamlı bir Docker Compose örneği:

- **Angular 18** SPA → nginx ile servis edilir
- **.NET 8 Web API** → ürün CRUD endpoint'leri sunar
- **PostgreSQL 16** → ana veritabanı
- **Redis 7** → API'nin cache katmanı
- **pgAdmin 4** → PostgreSQL yönetim arayüzü
- **RedisInsight** → Redis yönetim arayüzü

## Mimari

```
┌─────────────┐     HTTP        ┌──────────┐    /api/*     ┌─────────────┐
│  Tarayıcı   │ ──────────────▶ │  nginx   │ ────────────▶ │   .NET API  │
│             │                 │  (web)   │               │    (api)    │
└─────────────┘                 │  port 80 │               │  port 8080  │
                                └──────────┘               └─────┬───────┘
                                                                 │
                                                       ┌─────────┴─────────┐
                                                       ▼                   ▼
                                                 ┌──────────┐        ┌──────────┐
                                                 │PostgreSQL│        │  Redis   │
                                                 │ port 5432│        │ port 6379│
                                                 └────┬─────┘        └─────┬────┘
                                                      │                    │
                                                      ▼                    ▼
                                                 ┌─────────┐         ┌──────────────┐
                                                 │ pgAdmin │         │ RedisInsight │
                                                 │ port 5050        │  port 5540   │
                                                 └─────────┘         └──────────────┘
```

**Veri akışı (`GET /api/products`):**

1. Angular UI `/api/products` çağrısı yapar
2. nginx bu çağrıyı `http://api:8080/api/products`'a proxy'ler
3. .NET API önce **Redis'e** bakar (`products:all` key'i)
4. Cache HIT ise Redis'ten anında döndürür → `X-Cache: HIT` header'ı
5. Cache MISS ise PostgreSQL'i sorgular, sonucu Redis'e 60 saniye TTL ile yazar → `X-Cache: MISS` header'ı

## Port Haritası

| Servis | URL | Erişim |
|---|---|---|
| Angular UI | http://localhost:4200 | Ana uygulama |
| .NET API | http://localhost:8080 | REST API root |
| Swagger UI | http://localhost:8080/swagger | API dokümantasyonu |
| API Health | http://localhost:8080/health | Sağlık kontrolü |
| PostgreSQL | localhost:5432 | DBeaver/psql ile |
| Redis | localhost:6379 | redis-cli ile |
| pgAdmin | http://localhost:5050 | Web UI |
| RedisInsight | http://localhost:5540 | Web UI |

## Hızlı Başlangıç

```bash
cd labs/07-fullstack-compose

# 1. (Opsiyonel) .env dosyası oluştur
cp .env.example .env

# 2. Tüm stack'i ayağa kaldır (ilk seferinde 5-10 dk; image build + npm install + dotnet restore)
docker compose up -d

# 3. Tüm servisler healthy oldu mu?
docker compose ps

# 4. Logları izle
docker compose logs -f api
# Ctrl+C ile bırak

# 5. Tarayıcıdan aç
open http://localhost:4200      # Angular UI
open http://localhost:8080/swagger  # .NET Swagger
open http://localhost:5050      # pgAdmin
open http://localhost:5540      # RedisInsight
```

## Test Senaryoları

### 1) API doğrudan test

```bash
# Tüm ürünler
curl -i http://localhost:8080/api/products

# İlk istek: X-Cache: MISS (PostgreSQL'den geldi)
# İkinci istek: X-Cache: HIT  (Redis'ten geldi)
curl -i http://localhost:8080/api/products | grep -i x-cache
curl -i http://localhost:8080/api/products | grep -i x-cache

# Tek ürün
curl http://localhost:8080/api/products/1

# Yeni ürün ekle (cache otomatik temizlenir)
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Tablet","price":15000,"category":"Elektronik"}'

# Manuel cache temizle
curl -X DELETE http://localhost:8080/api/products/cache
```

### 2) PostgreSQL'i pgAdmin'den incele

1. http://localhost:5050 → email `admin@local.dev`, password `admin`
2. Sol menüde "Fullstack Lab DB" sunucusu zaten ekli (servers.json ile otomatik)
3. Bağlanırken şifre sorulursa: `apppass`
4. `productsdb` → Schemas → public → Tables → `Products` üzerinde sağ tık → "View/Edit Data → All Rows"
5. SQL editör: Tools → Query Tool → şu sorguyu çalıştırın:
   ```sql
   SELECT * FROM "Products" ORDER BY "Id";
   SELECT * FROM app_events;
   ```

### 3) Redis'i RedisInsight'tan incele

1. http://localhost:5540
2. "Add Redis Database" → "Add Database Manually"
   - Host: `redis`, Port: `6379`, Name: `Lab Redis`
3. Browser'da `products:all` key'ini görün; içinde JSON formatında ürün listesi
4. UI önce Angular'da bir kez `/api/products` çağırın (cache MISS), sonra tekrar (cache HIT) — `products:all` key'inin TTL'sinin 60 sn'den geri saydığını izleyin

### 4) Volume kalıcılığı testi

```bash
# Tüm container'ları durdur (volume'ler durur)
docker compose down

# Yeniden başlat - veritabanı verisi hâlâ orada!
docker compose up -d
sleep 30
curl http://localhost:8080/api/products | head

# Volume'leri DE sil (verileri kaybedersiniz!)
docker compose down -v
```

### 5) Container'ları gözlemle

```bash
# Hangi container hangi ağda?
docker network inspect 07-fullstack-compose_app-net | grep -A1 Name

# Bir container'dan diğerine ping (DNS çalışıyor mu?)
docker compose exec api curl -s http://postgres:5432 || echo "postgres erişilebilir"
docker compose exec api curl -s http://redis:6379 || echo "redis erişilebilir"

# Kaynak kullanımı
docker stats --no-stream

# API loglarında cache HIT/MISS görmek için:
docker compose logs -f api | grep -i cache
```

## Klasör Yapısı

```
07-fullstack-compose/
├── README.md                    # Bu dosya
├── compose.yaml                 # 6 servisli Docker Compose
├── .env.example                 # Çevre değişkeni şablonu
│
├── api/                         # .NET 8 Web API kaynak kodu
│   ├── Dockerfile               # Multi-stage build
│   ├── ProductsApi.csproj       # NuGet bağımlılıkları
│   ├── Program.cs               # Bootstrap + DI + middleware
│   ├── appsettings.json         # Connection string'ler
│   ├── Controllers/
│   │   └── ProductsController.cs # /api/products endpoint'leri
│   ├── Data/
│   │   └── AppDbContext.cs      # EF Core DbContext + Seed
│   └── Models/
│       └── Product.cs           # POCO model
│
├── web/                         # Angular 18 SPA kaynak kodu
│   ├── Dockerfile               # Multi-stage: Node build → nginx serve
│   ├── nginx.conf               # SPA routing + /api proxy
│   ├── package.json
│   ├── angular.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   └── src/
│       ├── index.html
│       ├── main.ts              # Bootstrap
│       ├── styles.css
│       └── app/
│           ├── app.config.ts    # HttpClient provider
│           ├── app.component.ts # UI + state (signal'lar)
│           └── product.service.ts # API çağrıları
│
└── db/
    ├── init.sql                 # PostgreSQL açılış scripti
    └── pgadmin-servers.json     # pgAdmin'e otomatik server tanımı
```

## Anlatılması Gereken Kavramlar

### 1) Service discovery (DNS by name)

API, PostgreSQL'e **`postgres`** ismiyle bağlanır (`Host=postgres;...`). Compose, `app-net` adlı user-defined bridge ağı oluşturur ve bu ağda her container ismi DNS'e kayıt olur. nginx de aynı şekilde `http://api:8080` der.

### 2) `depends_on` + `condition: service_healthy`

```yaml
depends_on:
  postgres:
    condition: service_healthy
```

Sadece `depends_on: [postgres]` yetmez — container başlamış ama PostgreSQL hâlâ initialize olurken API patlardı. Healthcheck ile *gerçekten hazır* olmasını bekleriz.

### 3) Multi-stage build

- **API:** `dotnet/sdk:8.0` (build) → `dotnet/aspnet:8.0` (runtime, ~200 MB az)
- **Web:** `node:20-alpine` (build) → `nginx:1.27-alpine` (serve, ~30 MB)

### 4) Reverse proxy

Tarayıcı sadece port 4200'ü görür. `/api/*` çağrıları nginx tarafından `http://api:8080/api/*`'a proxy'lenir. CORS sorunu yoktur, API doğrudan dış dünyaya açık değildir.

### 5) Cache pattern

Klasik **read-through cache** pattern'i:

```
GET /api/products
  ├── Redis'e bak → varsa döndür (~ms)
  └── yoksa PostgreSQL → Redis'e yaz → döndür
```

`POST /api/products` → DB'ye yazar + cache'i siler (write-through invalidation).

### 6) Veri kalıcılığı

- `pgdata` volume → PostgreSQL data dizini
- `redisdata` volume → Redis appendonly dosyaları
- `pgadmindata`, `redisinsightdata` → UI ayarları

`docker compose down -v` yapmadığınız sürece tüm veriler korunur.

### 7) Auto-init pattern'i

API'nin `Program.cs`'i açılışta:
1. PostgreSQL'in hazır olmasını 30 sn'ye kadar bekler (retry loop)
2. `EnsureCreatedAsync()` ile şemayı oluşturur (yoksa)
3. Boş ise seed data yükler (8 ürün)

## Sorun Giderme

### "port is already allocated"

Bir port (örn. 5432) host'ta başka bir process tarafından kullanılıyor. Compose dosyasında port'u değiştirin: `"15432:5432"`.

### API "PostgreSQL hazır değil" hatasıyla başlamıyor

Healthcheck henüz tetiklenmemiş olabilir. 30 sn bekleyin. Hâlâ olmuyorsa:

```bash
docker compose logs postgres
docker compose restart api
```

### Angular build "out of memory" hatası

Node 20 yeterli olmalı; Mac/Windows Docker Desktop'ta RAM artırın (Preferences → Resources → 4-6 GB önerilir).

### pgAdmin'de bağlantı hatası

Default ayarlarla `Fullstack Lab DB` sunucusu otomatik eklenir. Bağlantıda şifre sorarsa: `apppass`. Yine olmazsa Object Explorer'da sunucuya sağ tık → "Properties" → Connection sekmesi → şifreyi yeniden girin ve "Save Password" işaretleyin.

### RedisInsight bağlantı kuramıyor

Add Database wizard'ında host olarak `localhost` değil, **`redis`** yazın (RedisInsight container'ı `redis` ismini Docker DNS'i ile çözer).

### "permission denied" — pgdata volume'da

Linux host'ta UID uyumsuzluğu olabilir. `docker compose down -v && docker compose up -d` ile sıfırdan kurun.

## Temizlik

```bash
# Container'ları durdur ve sil (volume'ler kalır)
docker compose down

# Volume'leri de sil (veriler gider!)
docker compose down -v

# Image'ları da kaldır (yer açmak için)
docker compose down -v --rmi all

# Manuel temizlik
docker container prune -f
docker image prune -a -f
docker volume prune -f
```

## İleri Seviye Egzersizler

1. **Profile'lar ekleyin** — `pgadmin` ve `redisinsight` servislerine `profiles: [tools]` ekleyin. Sadece `docker compose --profile tools up` ile araçları açın.
2. **Internal network kullanın** — DB'leri ayrı bir `internal: true` ağa koyun, API her iki ağda olsun. DB'ler dışa hiç açılmasın.
3. **Resource limits** — Her servise `deploy.resources.limits` ekleyin (memory/cpus).
4. **Production split** — `compose.yaml` + `compose.prod.yaml` override'ı ile dev/prod ayrımı yapın (port'ları kapat, secret kullan, `restart: always`).
5. **Healthcheck'ten Compose'a** — `--scale api=3` ile API'yi 3 instance açın; nginx upstream block'una `api:8080` round-robin ekleyin.
