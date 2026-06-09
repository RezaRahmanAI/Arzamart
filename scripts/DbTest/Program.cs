using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Microsoft.Data.SqlClient;

class Program
{
    static void Main()
    {
        string connStr = "Data Source=104.234.134.230\\MSSQLSERVER2019;Initial Catalog=arzamartcom;Persist Security Info=True;User ID=sherasho_arzamartdb;Password=3vQ4$lKrPue8%mys;Pooling=True;MultipleActiveResultSets=True;Encrypt=True;TrustServerCertificate=True;";
        try
        {
            using (var conn = new SqlConnection(connStr))
            {
                conn.Open();
                Console.WriteLine("Connection successful!");

                var roles = new List<object>();
                using (var cmd = new SqlCommand("SELECT r.Id, r.Name, r.Description, r.IsSystemRole, r.CreatedAt, (SELECT COUNT(*) FROM staff_users u WHERE u.RoleId = r.Id AND u.DeletedAt IS NULL) as StaffCount FROM roles r ORDER BY r.Name", conn))
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        roles.Add(new
                        {
                            id = reader["Id"],
                            name = reader["Name"],
                            description = reader["Description"] == DBNull.Value ? null : reader["Description"].ToString(),
                            isSystemRole = reader["IsSystemRole"],
                            createdAt = reader["CreatedAt"],
                            staffCount = reader["StaffCount"]
                        });
                    }
                }

                var response = new
                {
                    success = true,
                    data = roles,
                    message = "Roles retrieved successfully."
                };

                string json = JsonSerializer.Serialize(response, new JsonSerializerOptions { WriteIndented = true });
                Console.WriteLine("\n--- API Response JSON ---");
                Console.WriteLine(json);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error: " + ex.Message);
        }
    }
}

