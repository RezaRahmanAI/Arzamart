using System;
using System.IO;
using ECommerce.API.Helpers;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ECommerce.API.Services;

public class ProductAdminHelper : IProductAdminHelper
{
    private readonly IConfiguration _config;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<ProductAdminHelper> _logger;

    public ProductAdminHelper(IConfiguration config, IWebHostEnvironment environment, ILogger<ProductAdminHelper> logger)
    {
        _config = config;
        _environment = environment;
        _logger = logger;
    }

    public void DeleteImageFile(string imageUrl)
    {
        try
        {
            var fileName = Path.GetFileName(imageUrl);
            var uploadsFolder = PathHelper.GetUploadsFolder(_config, _environment, "products");
            var filePath = Path.Combine(uploadsFolder, fileName);
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete image file {ImageUrl}", imageUrl);
        }
    }
}
