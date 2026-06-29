using System;
using Microsoft.Data.SqlClient;

class Program
{
    static void Main(string[] args)
    {
        string[] connectionStrings = new string[]
        {
            // Option 1: Original connection string (with Pooling=False)
            "Data Source=104.234.134.230\\MSSQLSERVER2019;Initial Catalog=arzamartcom;Persist Security Info=True;User ID=sherasho_arzamartdb;Password=3vQ4$lKrPue8%mys;Pooling=False;MultipleActiveResultSets=True;Encrypt=True;TrustServerCertificate=True;Command Timeout=0",

            // Option 2: Turn off Encryption (bypasses SSL handshake timeouts entirely)
            "Data Source=104.234.134.230\\MSSQLSERVER2019;Initial Catalog=arzamartcom;Persist Security Info=True;User ID=sherasho_arzamartdb;Password=3vQ4$lKrPue8%mys;Pooling=True;MultipleActiveResultSets=True;Encrypt=False;TrustServerCertificate=True;Command Timeout=0;Connection Timeout=30",

            // Option 3: Use Encryption with Pooling and Connect Timeout
            "Data Source=104.234.134.230\\MSSQLSERVER2019;Initial Catalog=arzamartcom;Persist Security Info=True;User ID=sherasho_arzamartdb;Password=3vQ4$lKrPue8%mys;Pooling=True;MultipleActiveResultSets=True;Encrypt=True;TrustServerCertificate=True;Command Timeout=0;Connection Timeout=30"
        };

        for (int i = 0; i < connectionStrings.Length; i++)
        {
            Console.WriteLine($"\n--- Testing Connection String {i + 1} ---");
            Console.WriteLine(connectionStrings[i].Replace("Password=3vQ4$lKrPue8%mys", "Password=***"));
            
            try
            {
                using (var conn = new SqlConnection(connectionStrings[i]))
                {
                    var start = DateTime.Now;
                    conn.Open();
                    var duration = DateTime.Now - start;
                    Console.WriteLine($"SUCCESS! Connection opened in {duration.TotalMilliseconds:F2}ms");
                    
                    using (var cmd = new SqlCommand("SELECT @@VERSION", conn))
                    {
                        var version = cmd.ExecuteScalar();
                        Console.WriteLine($"DB Version: {version?.ToString().Substring(0, 50)}...");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"FAILED: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner: {ex.InnerException.Message}");
                }
            }
        }
    }
}
