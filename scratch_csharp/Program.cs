using System;
using Microsoft.EntityFrameworkCore;
using ECommerce.Infrastructure.Data;

class Program
{
    static void Main(string[] args)
    {
        var connectionString = "Data Source=104.234.134.230\\MSSQLSERVER2019;Initial Catalog=arzamartcom;Persist Security Info=True;User ID=sherasho_arzamartdb;Password=3vQ4$lKrPue8%mys;Pooling=True;MultipleActiveResultSets=True;Encrypt=True;TrustServerCertificate=True;Command Timeout=0";
        
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        optionsBuilder.UseSqlServer(connectionString);
        
        using (var db = new ApplicationDbContext(optionsBuilder.Options))
        {
            try
            {
                Console.WriteLine("Adding column 'IsBundle' to dbo.Products...");
                db.Database.ExecuteSqlRaw("ALTER TABLE dbo.Products ADD IsBundle bit NOT NULL DEFAULT 0");
                Console.WriteLine("Column added successfully!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Result: {ex.Message}");
            }
        }
    }
}
