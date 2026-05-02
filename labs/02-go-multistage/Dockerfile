# Modül 6 - Multi-stage build
# Hedef: 300+ MB derleyici imajından 10 MB civarı runtime imajına inmek

# === AŞAMA 1: builder ===
FROM golang:1.22-alpine AS builder

WORKDIR /src

# Önce module dosyasını kopyala (cache!)
COPY go.mod ./
# Eğer go.sum varsa onu da kopyala (bizde yok çünkü external dep yok)
# COPY go.sum ./
RUN go mod download

# Sonra kaynak kodu
COPY . .

# Statik binary build (CGO kapalı, distroless'a koyabilmek için)
# -ldflags='-s -w' debug sembollerini atar, binary'yi küçültür
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags='-s -w' -o /out/app .


# === AŞAMA 2: runtime ===
# distroless/static = sadece glibc-free temel CA sertifikaları + tzdata
# Shell yok, paket yöneticisi yok, neredeyse hiçbir şey yok = çok güvenli
FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=builder /out/app /app

# distroless/static'in nonroot varyantında zaten "nonroot" kullanıcısı tanımlı (UID 65532)
USER nonroot:nonroot

EXPOSE 8080

ENTRYPOINT ["/app"]
