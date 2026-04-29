using ECommerce.API.Helpers;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Data;
using ECommerce.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using System.Text.Json.Serialization;

namespace ECommerce.API.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection AddAppServices(this IServiceCollection services, IConfiguration config)
    {
        // 1. Controllers & JSON Options
        services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
                options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
                options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            });

        // 2. Performance: Compression
        services.AddResponseCompression(options =>
        {
            options.EnableForHttps = true;
            options.Providers.Add<BrotliCompressionProvider>();
            options.Providers.Add<GzipCompressionProvider>();
            options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(
                new[] { "image/svg+xml", "application/json", "application/javascript", "text/css" });
        });

        services.Configure<BrotliCompressionProviderOptions>(options => options.Level = CompressionLevel.Fastest); // Fastest is often better for shared hosting CPU
        services.Configure<GzipCompressionProviderOptions>(options => options.Level = CompressionLevel.Fastest);

        // 3. Caching
        services.AddMemoryCache();
        
        var redisConn = config["Redis:ConnectionString"];
        Console.WriteLine($"[DEBUG] Redis Connection String from Config: '{redisConn}'");
        if (string.IsNullOrEmpty(redisConn) || redisConn.Equals("Disabled", StringComparison.OrdinalIgnoreCase))
        {
            services.AddDistributedMemoryCache();
        }
        else
        {
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = redisConn;
                options.InstanceName = "Arzamart_";
            });
        }

        services.AddSingleton<ICacheService, CacheService>();

        services.AddOutputCache(options =>
        {
            options.AddPolicy("DefaultPolicy", builder => 
                builder.Expire(TimeSpan.FromMinutes(5)));
            
            options.AddPolicy("Products", builder =>
                builder.Expire(TimeSpan.FromMinutes(10))
                       .Tag("products"));

            options.AddPolicy("Categories", builder =>
                builder.Expire(TimeSpan.FromMinutes(5))
                       .Tag("categories"));
        });

        services.AddResponseCaching();

        // 4. Rate Limiting for DDoS protection
        services.AddRateLimiter(options =>
        {
            options.AddFixedWindowLimiter("fixed", limiterOptions =>
            {
                limiterOptions.PermitLimit = 100;
                limiterOptions.Window = TimeSpan.FromMinutes(1);
                limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                limiterOptions.QueueLimit = 20;
            });
            options.AddSlidingWindowLimiter("sliding", limiterOptions =>
            {
                limiterOptions.PermitLimit = 50;
                limiterOptions.Window = TimeSpan.FromSeconds(10);
                limiterOptions.SegmentsPerWindow = 5;
                limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                limiterOptions.QueueLimit = 10;
            });
        });

        // 5. Infrastructure
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddHttpContextAccessor();
        services.AddAutoMapper(cfg => cfg.AddMaps(typeof(MappingProfiles).Assembly, typeof(OrderService).Assembly));

        // 6. Business Services
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<CustomerService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<INavigationService, NavigationService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<IReviewService, ReviewService>();
        services.AddSignalR();

        return services;
    }

    public static IServiceCollection AddDatabaseServices(this IServiceCollection services, IConfiguration config)
    {
        var connectionString = ResolveConnectionString(config);

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            // Prevent hard startup crash (IIS 500.30) when env vars are missing.
            // The API can still boot and expose diagnostics while DB issues are fixed.
            connectionString = "Server=localhost;Database=arzamart_placeholder;User Id=sa;Password=Placeholder123!;Encrypt=False;TrustServerCertificate=True;";
            Console.Error.WriteLine("WARNING: No DefaultConnection was found in configuration. Using placeholder SQL connection string to keep API startup alive.");
        }

        services.AddDbContextPool<ApplicationDbContext>(options =>
            options.UseSqlServer(connectionString,
                sqlOptions => {
                    sqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 3,
                        maxRetryDelay: TimeSpan.FromSeconds(5),
                        errorNumbersToAdd: null);
                    sqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
                    sqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "dbo");
                }));

        return services;
    }

    private static string? ResolveConnectionString(IConfiguration config)
    {
        return config.GetConnectionString("DefaultConnection")
            ?? config["ConnectionStrings:DefaultConnection"]
            ?? config["ConnectionStrings__DefaultConnection"]
            ?? config["SQLCONNSTR_DefaultConnection"]
            ?? config["CUSTOMCONNSTR_DefaultConnection"]
            ?? config["AZURE_SQL_CONNECTIONSTRING"];
    }

    public static IServiceCollection AddExoosisAuthServices(this IServiceCollection services, IConfiguration config)
    {
        // JWT Setup
        var jwtKey = config["Token:Key"] ?? "development_key_arzamart_123456789";
        var keyBytes = Encoding.UTF8.GetBytes(jwtKey);
        if (keyBytes.Length < 32)
        {
            using var sha256 = SHA256.Create();
            keyBytes = sha256.ComputeHash(keyBytes);
        }

        // 1. Identity Setup
        services.AddIdentityCore<ApplicationUser>(options =>
        {
            options.Password.RequireDigit = false;
            options.Password.RequireLowercase = false;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequireUppercase = false;
            options.Password.RequiredLength = 4;
        })
        .AddRoles<IdentityRole>()
        .AddEntityFrameworkStores<ApplicationDbContext>();

        // 2. Authentication Setup
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
                ValidIssuer = config["Token:Issuer"] ?? "Arza Mart",
                ValidateIssuer = true,
                ValidAudience = config["Token:Audience"] ?? "Arza Mart Users",
                ValidateAudience = true,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(5)
            };
        });

        services.AddAuthorization();

        return services;
    }


    public static IServiceCollection AddCustomCors(this IServiceCollection services, IConfiguration config, IWebHostEnvironment env)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("DefaultPolicy", builder =>
            {
                // Always Load from config if available
                var allowedOrigins = config.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
                
                if (env.IsDevelopment())
                {
                    // Development: Allow everything
                    builder.SetIsOriginAllowed(_ => true)
                           .AllowAnyMethod()
                           .AllowAnyHeader()
                           .AllowCredentials();
                }
                else if (allowedOrigins.Length > 0)
                {
                    // Production: Use configured origins
                    builder.WithOrigins(allowedOrigins)
                           .AllowAnyMethod()
                           .AllowAnyHeader()
                           .AllowCredentials();
                }
                else
                {
                    // Production Fallback: Hardcoded safe defaults
                    builder.WithOrigins("https://arzamart.com", "https://www.arzamart.com", "https://api.arzamart.com")
                           .AllowAnyMethod()
                           .AllowAnyHeader()
                           .AllowCredentials();
                }
                
                builder.WithExposedHeaders("Content-Disposition", "Content-Length", "X-Pagination", "Authorization");
            });
        });

        return services;
    }

    public static IServiceCollection AddSwaggerServices(this IServiceCollection services, IWebHostEnvironment env)
    {
        // Swagger middleware is enabled in Program.cs for all environments.
        // Registering these services unconditionally prevents startup failure
        // in production when `/swagger` is requested.
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();

        return services;
    }
}
