using ECommerce.API.Extensions;
using ECommerce.API.Middleware;
using ECommerce.Core.Constants;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Serilog;

// ── 0. Initial Logging for Fatal Startup Errors ──────────────────
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting ARZA API...");

    var builder = WebApplication.CreateBuilder(args);

    // ── 1. Register Services ──────────────────────────────────────────
    builder.Host.UseSerilog((context, services, configuration) =>
    {
        try
        {
            configuration
                .ReadFrom.Configuration(context.Configuration)
                .ReadFrom.Services(services)
                .Enrich.FromLogContext();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"SERILOG CONFIG ERROR: {ex.Message}");
            configuration
                .MinimumLevel.Information()
                .Enrich.FromLogContext()
                .WriteTo.Console();
        }
    });

    // ── 2. Server Configuration ───────────────────────────────────────
    builder.WebHost.ConfigureKestrel(serverOptions =>
    {
        serverOptions.Limits.MaxRequestBodySize = AppConstants.MaxRequestBodySize;
    });

    builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(x =>
    {
        x.ValueLengthLimit = int.MaxValue;
        x.MultipartBodyLengthLimit = AppConstants.MaxRequestBodySize;
    });

    // ── 3. Services Registration ─────────────────────────────────────
    builder.Services.AddDatabaseServices(builder.Configuration);
    builder.Services.AddExoosisAuthServices(builder.Configuration, builder.Environment);
    builder.Services.AddAppServices(builder.Configuration);
    builder.Services.AddCustomCors(builder.Configuration, builder.Environment);
    builder.Services.AddSwaggerServices(builder.Environment);
    builder.Services.AddSignalR(options =>
    {
        options.EnableDetailedErrors = false;
        options.KeepAliveInterval = TimeSpan.FromSeconds(15);
        options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
        options.HandshakeTimeout = TimeSpan.FromSeconds(15);
    });

    var app = builder.Build();

    // ── 4. Middleware Pipeline ───────────────────────────────────────

    // Security Headers (early in pipeline)
    app.UseMiddleware<ECommerce.API.Middleware.SecurityHeadersMiddleware>();

    // Global Exception & Logging (Absolute Top)
    app.UseAppExceptionHandling();

    // Request Timing (Right after exception handling)
    app.UseMiddleware<TimingMiddleware>();

    app.UseAppSecurityMiddleware();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "Arza Mart API v1");
            c.RoutePrefix = "swagger";
            c.InjectStylesheet("/swagger-ui/SwaggerDark.css");
        });
    }
    
    if (!app.Environment.IsDevelopment())
    {
        app.UseHsts();
    }
    app.UseHttpsRedirection();
    app.UseResponseCompression();

    // Static Files & Media
    app.UseStaticFiles(new StaticFileOptions
    {
        OnPrepareResponse = ctx => ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=2592000,immutable")
    });

    // Serve uploads from ExternalMediaPath (if configured) or wwwroot/uploads
    app.ConfigureExternalMedia(app.Configuration, app.Environment);



    app.UseRouting();

    app.UseCors("DefaultPolicy");

    // Content-Type Validation (after CORS so preflight/error responses include CORS headers)
    app.UseMiddleware<ECommerce.API.Middleware.ContentTypeValidationMiddleware>();

    // Audit Logging (after CORS, uses auth info from later middleware)
    app.UseMiddleware<ECommerce.API.Middleware.AuditLoggingMiddleware>();

    app.UseRateLimiter();

    app.UseAuthentication();
    app.UseAuthorization();

    // Token Revocation Check (after auth, before controllers)
    app.UseMiddleware<ECommerce.API.Middleware.TokenRevocationMiddleware>();

    app.UseMiddleware<ECommerce.API.Middleware.SecurityMiddleware>();
    app.UseMiddleware<ECommerce.API.Middleware.CustomForbiddenMiddleware>();

    app.UseResponseCaching();

    app.MapControllers();
    app.MapHub<ECommerce.API.Hubs.OrderHub>("/hubs/orders").RequireAuthorization().RequireCors("DefaultPolicy");

    // ── 5. Smart One-Time Seeder ────────────────────────────────────
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var context = services.GetRequiredService<ApplicationDbContext>();
        var loggerFactory = services.GetService<ILoggerFactory>();
        
        // Ensure static categories exist (this method has internal check to skip if already present)
        await DataSeeder.SeedAsync(userManager, roleManager, context, loggerFactory);
    }

    app.Run();
}
catch (HostAbortedException)
{
    throw; // Necessary for EF Core tooling
}
catch (Exception ex)
{
    Log.Fatal(ex, "ARZA API terminated unexpectedly during startup.");
    // Ensure error is visible in stdout for IIS diagnostic
    Console.Error.WriteLine($"FATAL STARTUP ERROR: {ex.Message}");
    Console.Error.WriteLine(ex.StackTrace);
}
finally
{
    Log.CloseAndFlush();
}
