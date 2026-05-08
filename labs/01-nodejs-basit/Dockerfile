# Modül 5 - Tek aşamalı (single-stage) Dockerfile
# Hedef: Node.js HTTP sunucusunu container'da çalıştırmak

FROM node:20-alpine

# Çalışma dizini
WORKDIR /app

# Önce SADECE bağımlılık manifesti kopyala (cache!)
# Kod değişse de package.json değişmediyse npm install cache'den gelir
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Sonra asıl kod
COPY --chown=node:node . .

# Non-root kullanıcı (alpine'de "node" kullanıcısı zaten var)
USER node

# Belgeleme amaçlı; -p ile yayınlamayı UNUTMA
EXPOSE 3000

# Healthcheck - Compose'da depends_on ile çok işe yarar
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3000/health || exit 1

# exec form (PID 1 doğrudan node olur, sinyal yakalama düzgün çalışır)
CMD ["node", "server.js"]
