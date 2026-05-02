# Modül 6 - Üç aşamalı Node.js / TypeScript multi-stage build
# Hedef: TypeScript derlemesini build aşamasında bırakıp, runtime'a sadece dist + production deps koymak

# === AŞAMA 1: deps - tüm bağımlılıkları kur (TypeScript dahil) ===
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm install


# === AŞAMA 2: build - TypeScript'i JavaScript'e derle ===
FROM deps AS build
WORKDIR /app

COPY tsconfig.json ./
COPY src ./src

RUN npm run build
# devDependencies'leri at, sadece production deps kalsın
RUN npm prune --omit=dev


# === AŞAMA 3: runtime - SADECE çalıştırmak için gerekenler ===
FROM node:20-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Build aşamasından temizlenmiş node_modules + derlenmiş dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./

# Alpine'in yerleşik "node" kullanıcısı (UID 1000)
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
