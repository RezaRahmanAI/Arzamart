using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Data;
using ECommerce.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
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
        });

        services.Configure<BrotliCompressionProviderOptions>(options => options.Level = CompressionLevel.Fastest);
        services.Configure<GzipCompressionProviderOptions>(options => options.Level = CompressionLevel.SmallestSize);

        // 3. Caching
        services.AddMemoryCache();
        services.AddResponseCaching();

        // 4. Infrastructure
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddHttpContextAccessor();
        services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

        // 5. Business Services
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<CustomerService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IBlogService, BlogService>();
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

    public static IServiceCollection AddIdentityServices(this IServiceCollection services, IConfiguration config)
    {
        // Identity Setup
        services.AddIdentity<ApplicationUser, IdentityRole>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequiredLength = 6;
        })
        .AddEntityFrameworkStores<ApplicationDbContext>()
        .AddDefaultTokenProviders();

        // JWT Setup
        var jwtKey = config["Token:Key"] ?? "Fallback_Key_For_Missing_Config_1234567890";
        
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
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                ValidIssuer = config["Token:Issuer"] ?? "ArzaMart",
                ValidateIssuer = true,
                ValidAudience = config["Token:Audience"] ?? "ArzaMartUsers",
                ValidateAudience = true,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,
                RoleClaimType = System.Security.Claims.ClaimTypes.Role
            };
        });

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
                           .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                           .WithHeaders("Content-Type", "Authorization", "X-Session-Id", "X-Requested-With")
                           .AllowCredentials();
                }
                else
                {
                    // Production Fallback: Hardcoded safe defaults
                    builder.WithOrigins("https://arzamart.shop", "https://www.arzamart.shop", "https://api.arzamart.shop")
                           .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                           .WithHeaders("Content-Type", "Authorization", "X-Session-Id", "X-Requested-With")
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
