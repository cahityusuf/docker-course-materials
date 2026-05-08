using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductsApi.Data;
using ProductsApi.Models;
using StackExchange.Redis;

namespace ProductsApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IDatabase _redis;
    private readonly ILogger<ProductsController> _logger;

    private const string CacheKey = "products:all";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromSeconds(60);

    public ProductsController(
        AppDbContext db,
        IConnectionMultiplexer redis,
        ILogger<ProductsController> logger)
    {
        _db = db;
        _redis = redis.GetDatabase();
        _logger = logger;
    }

    /// <summary>Tüm ürünleri getirir. Önce Redis cache'e bakar, yoksa PostgreSQL'den okur.</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Product>>> GetAll()
    {
        // 1) Önce cache'e bak
        var cached = await _redis.StringGetAsync(CacheKey);
        if (cached.HasValue)
        {
            _logger.LogInformation("Cache HIT - Redis'ten okundu");
            Response.Headers["X-Cache"] = "HIT";
            return Ok(JsonSerializer.Deserialize<List<Product>>(cached!));
        }

        // 2) Cache miss → PostgreSQL'den çek
        _logger.LogInformation("Cache MISS - PostgreSQL'den okunuyor");
        var products = await _db.Products.OrderBy(p => p.Id).ToListAsync();

        // 3) Cache'e yaz (60 sn TTL)
        await _redis.StringSetAsync(CacheKey, JsonSerializer.Serialize(products), CacheTtl);
        Response.Headers["X-Cache"] = "MISS";

        return Ok(products);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Product>> GetById(int id)
    {
        var product = await _db.Products.FindAsync(id);
        return product is null ? NotFound() : Ok(product);
    }

    [HttpPost]
    public async Task<ActionResult<Product>> Create([FromBody] Product product)
    {
        product.Id = 0;
        product.CreatedAt = DateTime.UtcNow;
        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        // Cache invalidation
        await _redis.KeyDeleteAsync(CacheKey);
        _logger.LogInformation("Yeni ürün eklendi (id={Id}), cache temizlendi", product.Id);

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
    }

    [HttpDelete("cache")]
    public async Task<IActionResult> ClearCache()
    {
        var deleted = await _redis.KeyDeleteAsync(CacheKey);
        return Ok(new { cleared = deleted });
    }
}
