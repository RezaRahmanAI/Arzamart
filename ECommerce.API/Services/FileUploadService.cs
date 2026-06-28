using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.API.Helpers;
using ECommerce.API.Helpers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace ECommerce.API.Services;

public class FileUploadService : IFileUploadService
{
    private readonly IConfiguration _config;
    private readonly IWebHostEnvironment _environment;

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".pdf"
    };

    private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB

    public FileUploadService(IConfiguration config, IWebHostEnvironment environment)
    {
        _config = config;
        _environment = environment;
    }

    public async Task<string> UploadAsync(IFormFile file, string subFolder)
    {
        if (file == null || file.Length == 0)
            throw new InvalidOperationException("No file uploaded.");

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
            throw new InvalidOperationException($"File type '{extension}' is not allowed. Allowed: {string.Join(", ", AllowedExtensions)}");

        if (file.Length > MaxFileSize)
            throw new InvalidOperationException($"File size {file.Length / 1024 / 1024:N1} MB exceeds maximum of {MaxFileSize / 1024 / 1024} MB.");

        var uploadsFolder = PathHelper.GetUploadsFolder(_config, _environment, subFolder);
        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return $"/uploads/{subFolder}/{fileName}";
    }

    public async Task<List<string>> UploadMultipleAsync(List<IFormFile> files, string subFolder)
    {
        var urls = new List<string>();
        foreach (var file in files)
        {
            var url = await UploadAsync(file, subFolder);
            urls.Add(url);
        }
        return urls;
    }
}
