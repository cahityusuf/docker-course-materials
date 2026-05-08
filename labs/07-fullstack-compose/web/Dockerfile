# Multi-stage Angular build → nginx serve

# === AŞAMA 1: build ===
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production


# === AŞAMA 2: serve ===
FROM nginx:1.27-alpine

# nginx config'imiz default'u eziyor
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Angular build çıktısı: dist/products-web/browser/ (Angular 18 application builder)
COPY --from=build /app/dist/products-web/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/ > /dev/null 2>&1 || exit 1

# nginx default CMD ile çalışır; foreground'da
CMD ["nginx", "-g", "daemon off;"]
