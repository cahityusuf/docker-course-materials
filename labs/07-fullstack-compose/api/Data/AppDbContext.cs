using Microsoft.EntityFrameworkCore;
using ProductsApi.Models;

namespace ProductsApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Name).IsRequired().HasMaxLength(200);
            entity.Property(p => p.Price).HasPrecision(10, 2);
            entity.Property(p => p.Category).HasMaxLength(100);
        });
    }
}

public static class SeedData
{
    public static async Task InitializeAsync(AppDbContext db, ILogger logger)
    {
        if (await db.Products.AnyAsync())
        {
            logger.LogInformation("Seed verisi zaten mevcut, atlanıyor.");
            return;
        }

        logger.LogInformation("Seed verisi yükleniyor...");
        db.Products.AddRange(
            new Product { Name = "Laptop Dell XPS 15", Price = 65000, Category = "Elektronik" },
            new Product { Name = "Mekanik Klavye", Price = 2200, Category = "Aksesuar" },
            new Product { Name = "Kablosuz Mouse", Price = 1100, Category = "Aksesuar" },
            new Product { Name = "Monitör 27\" 4K", Price = 12500, Category = "Elektronik" },
            new Product { Name = "USB-C Hub", Price = 750, Category = "Aksesuar" },
            new Product { Name = "Webcam HD", Price = 1850, Category = "Aksesuar" },
            new Product { Name = "SSD 1TB NVMe", Price = 3200, Category = "Depolama" },
            new Product { Name = "Mikrofon Studio", Price = 4400, Category = "Ses" }
        );

        await db.SaveChangesAsync();
        logger.LogInformation("Seed tamamlandı: {Count} kayıt eklendi", await db.Products.CountAsync());
    }
}
