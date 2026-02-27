using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class CustomerService
{
    private readonly ApplicationDbContext _context;

    public CustomerService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Customer?> GetCustomerByPhoneAsync(string phone)
    {
        // Normalize phone number if needed
        return await _context.Customers
            .FirstOrDefaultAsync(c => c.Phone == phone);
    }

    public async Task<Customer> CreateOrUpdateCustomerAsync(string phone, string name, string address)
    {
        var customer = await GetCustomerByPhoneAsync(phone);

        if (customer == null)
        {
            customer = new Customer
            {
                Phone = phone,
                Name = name,
                Address = address
            };
            _context.Customers.Add(customer);
        }
        else
        {
            // Update existing customer info
            customer.Name = name;
            customer.Address = address;
            customer.UpdatedAt = DateTime.UtcNow;
            _context.Customers.Update(customer);
        }

        await _context.SaveChangesAsync();
        return customer;
    }
    public async Task<(List<Customer> Items, int Total)> GetCustomersAsync(string? searchTerm, int page, int pageSize)
    {
        var query = _context.Customers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(c => c.Name.Contains(searchTerm) || c.Phone.Contains(searchTerm));
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, total);
    }
    public async Task<Customer?> GetCustomerByIdAsync(int id)
    {
        return await _context.Customers.FindAsync(id);
    }

    public async Task UpdateCustomerAsync(Customer customer)
    {
        _context.Customers.Update(customer);
        await _context.SaveChangesAsync();
    }
}
