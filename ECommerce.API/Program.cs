using ECommerce.API.Extensions;
using ECommerce.API.Middleware;
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
        serverOptions.Limits.MaxRequestBodySize = 104857600; // 100 MB
    });

    builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(x =>
    {
        x.ValueLengthLimit = int.MaxValue;
        x.MultipartBodyLengthLimit = 104857600; // 100 MB
    });

    // ── 3. Services Registration ─────────────────────────────────────
    builder.Services.AddDatabaseServices(builder.Configuration);
    builder.Services.AddExoosisAuthServices(builder.Configuration);
    builder.Services.AddAppServices(builder.Configuration);
    builder.Services.AddCustomCors(builder.Configuration, builder.Environment);
    builder.Services.AddSwaggerServices(builder.Environment);

    var app = builder.Build();

    // ── 4. Middleware Pipeline ───────────────────────────────────────

    // CORS (Must be at the very top to ensure preflights and error responses have headers)
    app.UseCors("DefaultPolicy");

    // Global Exception & Logging (Absolute Top)
    app.UseAppExceptionHandling();

    // Request Timing (Right after exception handling)
    app.UseMiddleware<TimingMiddleware>();

    app.UseAppSecurityMiddleware();

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

    app.UseRateLimiter();

    app.UseAuthentication();
    app.UseAuthorization();

    // Block suspicious users
    app.UseSuspiciousUserBlocking();

    app.UseResponseCaching();
    app.UseOutputCache();


    app.MapControllers();

    // ── 5. Smart One-Time Seeder ────────────────────────────────────
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        
        // Very fast check: Only seed if the user table is completely empty
        // Subsequent cold starts will skip this entirely after the first success
        if (!await userManager.Users.AnyAsync())
        {
            var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
            await DataSeeder.SeedAsync(userManager, roleManager);
            Log.Information("Initial data seeding completed (Super Admin created).");
        }
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
