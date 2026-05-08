using Microsoft.EntityFrameworkCore;
using ProductsApi.Data;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// === Servisler ===
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();

// CORS - Geliştirme aşamasında Angular'ın doğrudan API'ye ulaşması için
// (Production'da nginx proxy kullandığımız için CORS gerek yok)
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

// PostgreSQL
var pgConn = builder.Configuration.GetConnectionString("Postgres")
    ?? throw new InvalidOperationException("Postgres connection string yapılandırılmadı");
builder.Services.AddDbContext<AppDbContext>(opt => opt.UseNpgsql(pgConn));

// Redis
var redisConn = builder.Configuration.GetConnectionString("Redis")
    ?? throw new InvalidOperationException("Redis connection string yapılandırılmadı");
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
    ConnectionMultiplexer.Connect(redisConn));

var app = builder.Build();

// === Veritabanı şeması + seed (geliştirme için pratik) ===
// PostgreSQL henüz hazır değilse 30 sn'ye kadar bekle
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    var maxRetries = 15;
    for (var attempt = 1; attempt <= maxRetries; attempt++)
    {
        try
        {
            await db.Database.EnsureCreatedAsync();
            await SeedData.InitializeAsync(db, logger);
            logger.LogInformation("Veritabanı hazır ve seed tamamlandı");
            break;
        }
        catch (Exception ex)
        {
            logger.LogWarning("DB henüz hazır değil ({Attempt}/{Max}): {Msg}",
                attempt, maxRetries, ex.Message);
            if (attempt == maxRetries) throw;
            await Task.Delay(2000);
        }
    }
}

// === Pipeline ===
app.UseSwagger();
app.UseSwaggerUI(o => o.RoutePrefix = "swagger");
app.UseCors();
app.MapControllers();
app.MapHealthChecks("/health");

app.MapGet("/", () => Results.Ok(new
{
    service = "ProductsApi",
    version = "1.0",
    endpoints = new[] { "/api/products", "/health", "/swagger" }
}));

app.Run();
