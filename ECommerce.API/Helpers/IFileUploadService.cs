using Microsoft.AspNetCore.Http;

namespace ECommerce.API.Helpers;

public interface IFileUploadService
{
    Task<string> UploadAsync(IFormFile file, string subFolder);
    Task<List<string>> UploadMultipleAsync(List<IFormFile> files, string subFolder);
}
