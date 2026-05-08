# Multi-stage .NET 8 Web API build

# === AŞAMA 1: build ===
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Önce sadece csproj kopyala (NuGet restore cache için)
COPY *.csproj ./
RUN dotnet restore

# Sonra geri kalan kaynak
COPY . .
RUN dotnet publish -c Release -o /out --no-restore /p:UseAppHost=false


# === AŞAMA 2: runtime ===
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# curl - healthcheck için (aspnet:8.0 image'ında curl yok)
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /out ./

# .NET 8 base imajı varsayılan olarak port 8080 ve "app" non-root kullanıcı kullanır
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Development \
    DOTNET_RUNNING_IN_CONTAINER=true

USER app
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
    CMD curl -fs http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "ProductsApi.dll"]
