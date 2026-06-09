using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        using var client = new HttpClient();
        var json = await client.GetStringAsync("https://api.nuget.org/v3-flatcontainer/automapper/index.json");
        var doc = JsonDocument.Parse(json);
        foreach (var version in doc.RootElement.GetProperty("versions").EnumerateArray())
        {
            Console.WriteLine(version.GetString());
        }
    }
}
