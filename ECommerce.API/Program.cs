using ECommerce.Infrastructure.Data;
using ECommerce.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.ResponseCompression;
using System.IO.Compression;
using System.Text.Json;
using System.Text.Json.Serialization;

using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel for large file uploads
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 104857600; // 100 MB
});

builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(x =>
{
    x.ValueLengthLimit = int.MaxValue;
    x.MultipartBodyLengthLimit = 104857600; // 100 MB
    x.MultipartHeadersLengthLimit = int.MaxValue;
});

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

// Swagger: Only register in Development
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
}

// Performance: Brotli + Gzip Response Compression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[]
    {
        "application/json",
        "text/css",
        "application/javascript",
        "text/html",
        "image/svg+xml"
    });
});
builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});
builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.SmallestSize;
});

builder.Services.AddMemoryCache();
builder.Services.AddResponseCaching();


// Database with connection resiliency
var defaultConnection = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(defaultConnection))
{
    throw new InvalidOperationException("Missing required configuration: ConnectionStrings:DefaultConnection");
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(defaultConnection,
        sqlOptions => sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorNumbersToAdd: null)));

// Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options => {
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Token Services
builder.Services.AddScoped<ECommerce.Core.Interfaces.IJwtTokenService, ECommerce.Infrastructure.Services.JwtTokenService>();
builder.Services.AddScoped<ECommerce.Core.Interfaces.IAuthService, ECommerce.Infrastructure.Services.AuthService>();
// builder.Services.AddScoped<ECommerce.Core.Interfaces.ITokenService, ECommerce.Infrastructure.Services.TokenService>(); // Deprecated

// JWT Authentication
var jwtKey = builder.Configuration["Token:Key"];
var jwtIssuer = builder.Configuration["Token:Issuer"];
var jwtAudience = builder.Configuration["Token:Audience"];

if (string.IsNullOrWhiteSpace(jwtKey) || string.IsNullOrWhiteSpace(jwtIssuer) || string.IsNullOrWhiteSpace(jwtAudience))
{
    throw new InvalidOperationException("Missing required JWT configuration. Ensure Token:Key, Token:Issuer, and Token:Audience are set.");
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtKey)),
        ValidIssuer = jwtIssuer,
        ValidateIssuer = true,
        ValidAudience = jwtAudience,
        ValidateAudience = true,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,
        RoleClaimType = System.Security.Claims.ClaimTypes.Role // Explicitly map role claims
    };
});



builder.Services.AddScoped<ECommerce.Core.Interfaces.IUnitOfWork, ECommerce.Infrastructure.Data.UnitOfWork>();
builder.Services.AddScoped(typeof(ECommerce.Core.Interfaces.IGenericRepository<>), typeof(ECommerce.Infrastructure.Data.GenericRepository<>));
builder.Services.AddScoped<ECommerce.Core.Interfaces.IOrderService, ECommerce.Infrastructure.Services.OrderService>();
builder.Services.AddScoped<ECommerce.Infrastructure.Services.CustomerService>(); // Register CustomerService
builder.Services.AddScoped<ECommerce.Core.Interfaces.IDashboardService, ECommerce.Infrastructure.Services.DashboardService>();
builder.Services.AddScoped<ECommerce.Core.Interfaces.IBlogService, ECommerce.Infrastructure.Services.BlogService>();
builder.Services.AddScoped<ECommerce.Core.Interfaces.INavigationService, ECommerce.Infrastructure.Services.NavigationService>();
builder.Services.AddScoped<ECommerce.Core.Interfaces.IProductService, ECommerce.Infrastructure.Services.ProductService>();
builder.Services.AddScoped<ECommerce.Core.Interfaces.IReviewService, ECommerce.Infrastructure.Services.ReviewService>();
builder.Services.AddHttpContextAccessor(); // Add HttpContextAccessor
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// CORS - Environment-specific configuration
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

// Ensure critical origins are always allowed (Fail-safe)
var criticalOrigins = new[] 
{ 
    "http://localhost:4200", 
    "https://localhost:4200", 
    "https://arzamart.shop", 
    "https://www.arzamart.shop" 
};

// Combine and deduplicate
allowedOrigins = allowedOrigins.Concat(criticalOrigins).Distinct().ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        corsBuilder =>
        {
            corsBuilder.WithOrigins(allowedOrigins)
                   .AllowAnyMethod()
                   .AllowAnyHeader()
                   .AllowCredentials()
                   .WithExposedHeaders("Content-Disposition", "Content-Length", "X-Pagination");
        });
});


var app = builder.Build();

app.UseMiddleware<ECommerce.API.Middleware.GlobalExceptionMiddleware>();

// Swagger: Only in Development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Response compression MUST be before static files and routing
app.UseResponseCompression();

// Static files with aggressive caching for production
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        // Cache static files for 30 days
        ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=2592000,immutable");
    }
});

// Serve media from external ArzaMedia folder (Standardized for stability)
string externalMediaPath;
try
{
    // Try configuration first
    externalMediaPath = builder.Configuration["ExternalMediaPath"] ?? "";
    
    if (string.IsNullOrEmpty(externalMediaPath))
    {
        // Use a consistent folder adjacent to the content root, or fall back to local
        var contentRoot = builder.Environment.ContentRootPath;
        var parent = Directory.GetParent(contentRoot);
        
        // Use ../ArzaMedia if parent exists, otherwise ./ArzaMedia
        externalMediaPath = parent != null 
            ? Path.Combine(parent.FullName, "ArzaMedia") 
            : Path.Combine(contentRoot, "ArzaMedia");
    }

    if (!Directory.Exists(externalMediaPath))
    {
        Directory.CreateDirectory(externalMediaPath);
    }
}
catch (Exception ex)
{
    // Ultimate fallback for restricted permissions
    externalMediaPath = Path.Combine(builder.Environment.ContentRootPath, "Media");
    if (!Directory.Exists(externalMediaPath)) Directory.CreateDirectory(externalMediaPath);
    Console.WriteLine($"Startup Warning: Fell back to local media path: {externalMediaPath}. Error: {ex.Message}");
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(externalMediaPath),
    RequestPath = "/uploads",
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=2592000,immutable");
    }
});

// Response caching
app.UseResponseCaching();

// CORS must run before authentication/authorization so both preflight and API responses carry headers
app.UseCors("AllowAll");

// Global exception handling
app.UseMiddleware<ECommerce.API.Middleware.IpBlockingMiddleware>();
app.UseMiddleware<ECommerce.API.Middleware.VisitorTrackingMiddleware>();



app.UseAuthentication();
app.UseMiddleware<ECommerce.API.Middleware.RevokedTokenMiddleware>();
app.UseAuthorization();

app.MapControllers();

// Ensure Upload Directories Exist
try
{
    var uploadPaths = new[]
    {
        Path.Combine(externalMediaPath, "categories"),
        Path.Combine(externalMediaPath, "products"),
        Path.Combine(externalMediaPath, "banners"),
        Path.Combine(externalMediaPath, "subcategories")
    };

    foreach (var path in uploadPaths)
    {
        if (!Directory.Exists(path))
        {
            Directory.CreateDirectory(path);
        }
    }
}
catch (Exception ex)
{
    Log.Error(ex, "Failed to create upload directories");
}

// Seed Data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        context.Database.Migrate();
        
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        DataSeeder.SeedAsync(userManager, roleManager, context).GetAwaiter().GetResult();
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred during migration/seeding.");
    }
}

app.Run();
