using System;
using System.Linq;
using System.Text.Json;
using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using ECommerce.API.Helpers;

class Program
{
    static void Main(string[] args)
    {
        var connectionString = "Data Source=104.234.134.230\\MSSQLSERVER2019;Initial Catalog=arzamartcom;Persist Security Info=True;User ID=sherasho_arzamartdb;Password=3vQ4$lKrPue8%mys;Pooling=True;MultipleActiveResultSets=True;Encrypt=True;TrustServerCertificate=True;Command Timeout=0";
        
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        optionsBuilder.UseSqlServer(connectionString);
        
        using (var db = new ApplicationDbContext(optionsBuilder.Options))
        {
            var product = db.Products
                .IgnoreQueryFilters()
                .Include(p => p.Category)
                .Include(p => p.SubCategory)
                .Include(p => p.Images)
                .Include(p => p.Variants)
                .FirstOrDefault(p => p.Id == 108);
                
            if (product == null)
            {
                Console.WriteLine("Product 108 not found.");
                return;
            }
            
            Console.WriteLine($"Found Product: {product.Name} (ID: {product.Id})");
            Console.WriteLine($"Variants count in Entity: {product.Variants.Count}");
            foreach (var v in product.Variants)
            {
                Console.WriteLine($" - Variant ID: {v.Id}, Size: '{v.Size}', Price: {v.Price}, CompareAtPrice: {v.CompareAtPrice}, PurchaseRate: {v.PurchaseRate}, StockQuantity: {v.StockQuantity}");
            }
        }
    }
}
