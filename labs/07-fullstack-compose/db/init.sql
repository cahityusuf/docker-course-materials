-- PostgreSQL ilk açılış scripti
-- /docker-entrypoint-initdb.d/ altındaki .sql dosyaları yalnızca data dizini boşken çalışır.
--
-- NOT: Tablo şeması ve seed verisi .NET API tarafından (EF Core EnsureCreated +
-- SeedData) otomatik oluşturulur. Bu dosya sadece açıklayıcı meta bilgiler ekler.

COMMENT ON DATABASE productsdb IS
  'Docker fullstack lab - Angular frontend, .NET 8 API, Redis cache';

-- Geliştirme kolaylığı için extension hazır olsun
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Pratik bir audit log tablosu (API tarafından kullanılmıyor; pgAdmin'de örnek olsun diye)
CREATE TABLE IF NOT EXISTS app_events (
  id           BIGSERIAL PRIMARY KEY,
  event_type   VARCHAR(50)  NOT NULL,
  payload      JSONB,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO app_events (event_type, payload) VALUES
  ('startup', '{"source": "init.sql", "message": "Veritabani hazirlandi"}'::jsonb);
