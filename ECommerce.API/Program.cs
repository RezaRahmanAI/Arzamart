using ECommerce.API.Extensions;
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

    // ── 1. Logging (Serilog) ──────────────────────────────────────────
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
        serverOptions.Limits.MaxRequestBodySize = 104857600; // 100 MB
    });

    builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(x =>
    {
        x.ValueLengthLimit = int.MaxValue;
        x.MultipartBodyLengthLimit = 104857600; // 100 MB
    });

    // ── 3. Services Registration ─────────────────────────────────────
    builder.Services.AddDatabaseServices(builder.Configuration);
    builder.Services.AddIdentityServices(builder.Configuration);
    builder.Services.AddAppServices(builder.Configuration);
    builder.Services.AddCustomCors(builder.Configuration, builder.Environment);
    builder.Services.AddSwaggerServices(builder.Environment);

    var app = builder.Build();

    // ── 4. Middleware Pipeline ───────────────────────────────────────

    // Global Exception & Logging (Absolute Top)
    app.UseCustomMiddleware();

    app.UseSwagger();
    app.UseSwaggerUI();
    

    app.UseHttpsRedirection();
    app.UseResponseCompression();

    // Static Files & Media
    app.UseStaticFiles(new StaticFileOptions
    {
        OnPrepareResponse = ctx => ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=2592000,immutable")
    });
    app.ConfigureExternalMedia(builder.Configuration, builder.Environment);

    app.UseRouting();

    // CORS (Before Auth)
    app.UseCors("DefaultPolicy");

    app.UseAuthentication();
    app.UseMiddleware<ECommerce.API.Middleware.RevokedTokenMiddleware>();
    app.UseAuthorization();

    app.UseResponseCaching();

    app.MapControllers();

    // ── 5. Database Migration & Seeding ──────────────────────────────
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
            Log.Error(ex, "An error occurred during migration/seeding.");
        }
    }

    app.Run();
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
