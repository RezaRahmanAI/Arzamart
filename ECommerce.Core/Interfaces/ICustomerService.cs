using ECommerce.Core.Entities;

namespace ECommerce.Core.Interfaces;

public interface ICustomerService
{
    Task<Customer?> GetCustomerByPhoneAsync(string phone);
    Task<Customer> CreateOrUpdateCustomerAsync(string phone, string name, string address, string? city = null, string? area = null, string? userId = null, int? divisionId = null, int? districtId = null, int? upazilaId = null);
    Task<(List<Customer> Items, int Total)> GetCustomersAsync(string? searchTerm, int page, int pageSize);
    Task<Customer?> GetCustomerByIdAsync(int id);
    Task UpdateCustomerAsync(Customer customer);
    Task FlagCustomerAsync(int id, bool isSuspicious);
}
