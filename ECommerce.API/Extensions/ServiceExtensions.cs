using ECommerce.API.Helpers;
using ECommerce.API.Services;
using ECommerce.Core.Constants;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Cache;
using ECommerce.Infrastructure.Data;
using ECommerce.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Serialization;
using System.Text.Json;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

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
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
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

        // 3. Caching (AppCache singleton + warmup)
        services.AddMemoryCache(); // DashboardService (15s stats), CartController (per-user session), SecurityMiddleware (JWT revocation)
        services.AddSingleton<AppCache>();
        services.AddSingleton<CacheWarmupService>();
        services.AddHostedService(sp => sp.GetRequiredService<CacheWarmupService>());
        services.AddHostedService<CacheHealthCheckService>();

        services.AddSingleton<ECommerce.Infrastructure.Tracking.VisitorTrackingWorker>();
        services.AddHostedService(sp => sp.GetRequiredService<ECommerce.Infrastructure.Tracking.VisitorTrackingWorker>());

        services.AddResponseCaching();

        // 4. Rate Limiting for DDoS protection
        services.AddRateLimiter(options =>
        {
            options.AddFixedWindowLimiter("fixed", limiterOptions =>
            {
                limiterOptions.PermitLimit = RateLimits.FixedWindowPermitLimit;
                limiterOptions.Window = RateLimits.FixedWindowDuration;
                limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                limiterOptions.QueueLimit = RateLimits.FixedWindowQueueLimit;
            });
            options.AddSlidingWindowLimiter("sliding", limiterOptions =>
            {
                limiterOptions.PermitLimit = RateLimits.SlidingWindowPermitLimit;
                limiterOptions.Window = RateLimits.SlidingWindowDuration;
                limiterOptions.SegmentsPerWindow = RateLimits.SlidingWindowSegments;
                limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                limiterOptions.QueueLimit = RateLimits.SlidingWindowQueueLimit;
            });
        });

        // 5. Infrastructure
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddHttpContextAccessor();
        services.AddAutoMapper(cfg => cfg.AddMaps(typeof(MappingProfiles).Assembly, typeof(OrderService).Assembly));

        // 6. Business Services
        services.AddScoped<IOrderNumberGenerator, OrderNumberGenerator>();
        services.AddScoped<IOrderStockService, OrderStockService>();
        services.AddScoped<IOrderStatusService, OrderStatusService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<ICustomerService, CustomerService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<INavigationService, NavigationService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<IProductQueryService, ProductQueryService>();
        services.AddScoped<IReviewService, ReviewService>();
        services.AddScoped<ICartService, CartService>();
        services.AddScoped<ICategoryAdminService, CategoryAdminService>();
        services.AddScoped<ISubCategoryAdminService, SubCategoryAdminService>();
        services.AddScoped<IAdminSettingsService, AdminSettingsService>();
        services.AddScoped<IAdminBannerService, AdminBannerService>();
        services.AddScoped<IAdminPageService, AdminPageService>();
        services.AddScoped<IAdminNavigationService, AdminNavigationService>();
        services.AddScoped<IAdminReviewService, AdminReviewService>();
        services.AddScoped<IAdminSecurityService, AdminSecurityService>();
        services.AddScoped<IAdminSourcePageService, AdminSourcePageService>();
        services.AddScoped<IAdminSocialMediaSourceService, AdminSocialMediaSourceService>();
        services.AddScoped<IAdminCustomLandingPageService, AdminCustomLandingPageService>();
        services.AddScoped<IProductGroupService, ProductGroupService>();
        services.AddScoped<IInventoryService, InventoryService>();
        services.AddScoped<IActivityLogService, ActivityLogService>();
        services.AddScoped<IAdminUserService, ECommerce.API.Services.AdminUserService>();
        services.AddScoped<ECommerce.API.Helpers.IFileUploadService, FileUploadService>();
        services.AddScoped<IProductAdminHelper, ECommerce.API.Services.ProductAdminHelper>();
        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<IStaffService, StaffService>();
        services.AddScoped<ICustomLandingPageService, CustomLandingPageService>();
        services.AddScoped<IPublicCategoryService, PublicCategoryService>();
        services.AddScoped<IPublicSiteSettingsService, PublicSiteSettingsService>();
        services.AddScoped<IAnalyticsService, AnalyticsService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IIncompleteOrderService, IncompleteOrderService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();

        return services;
    }

    public static IServiceCollection AddDatabaseServices(this IServiceCollection services, IConfiguration config)
    {
        var connectionString = ResolveConnectionString(config);

        var maskedConnStr = connectionString != null 
            ? System.Text.RegularExpressions.Regex.Replace(connectionString, @"Password=[^;]+", "Password=***") 
            : "null";
        Console.WriteLine($"[DATABASE DIAGNOSTIC] Resolved connection string: {maskedConnStr}");

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

    public static IServiceCollection AddExoosisAuthServices(this IServiceCollection services, IConfiguration config, IWebHostEnvironment env)
    {
        // JWT Setup
        var jwtKey = config["Token:Key"];
        if (string.IsNullOrEmpty(jwtKey))
        {
            if (env.IsDevelopment())
            {
                jwtKey = "development_key_arzamart_123456789";
            }
            else
            {
                throw new InvalidOperationException(
                    "Token:Key is not configured. Set it in appsettings, user-secrets, or environment variables. " +
                    "This is required in production to prevent JWT token forgery.");
            }
        }
        var keyBytes = Encoding.UTF8.GetBytes(jwtKey);
        if (keyBytes.Length < 32)
        {
            using var sha256 = SHA256.Create();
            keyBytes = sha256.ComputeHash(keyBytes);
        }

        // 1. Identity Setup
        services.AddIdentityCore<ApplicationUser>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequireUppercase = true;
            options.Password.RequiredLength = 8;
            options.User.RequireUniqueEmail = true;
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
                ClockSkew = TimeSpan.FromMinutes(AppConstants.JwtClockSkewMinutes)
            };

            // SignalR sends the JWT token via query string (?access_token=...)
            // because WebSocket connections cannot use Authorization headers.
            options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var accessToken = context.Request.Query["access_token"];
                    var path = context.HttpContext.Request.Path;
                    if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    {
                        context.Token = accessToken;
                    }
                    return System.Threading.Tasks.Task.CompletedTask;
                }
            };
        });

        services.AddSingleton<Microsoft.AspNetCore.Authorization.IAuthorizationPolicyProvider, ECommerce.API.Middleware.PermissionPolicyProvider>();
        services.AddScoped<Microsoft.AspNetCore.Authorization.IAuthorizationHandler, ECommerce.API.Middleware.PermissionHandler>();

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
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();

        return services;
    }
}
