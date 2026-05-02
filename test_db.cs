using System;
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

                using (var transaction = conn.BeginTransaction())
                {
                    try
                    {
                        // Delete related data
                        new SqlCommand("DELETE FROM OrderItems", conn, transaction).ExecuteNonQuery();
                        new SqlCommand("DELETE FROM OrderLog", conn, transaction).ExecuteNonQuery();
                        new SqlCommand("DELETE FROM OrderNotes", conn, transaction).ExecuteNonQuery();
                        
                        // Delete Orders
                        new SqlCommand("DELETE FROM Orders", conn, transaction).ExecuteNonQuery();

                        // Reseed Identity
                        // If we set it to 12999, the next inserted row will be 13000
                        new SqlCommand("DBCC CHECKIDENT ('Orders', RESEED, 12999)", conn, transaction).ExecuteNonQuery();

                        transaction.Commit();
                        Console.WriteLine("Successfully deleted all orders and reseeded identity to 12999.");
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        Console.WriteLine("Transaction rolled back due to error: " + ex.Message);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.Message);
        }
    }
}
