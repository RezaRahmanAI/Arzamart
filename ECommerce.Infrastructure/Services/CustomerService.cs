using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class CustomerService : ICustomerService
{
    private readonly IUnitOfWork _unitOfWork;

    public CustomerService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Customer?> GetCustomerByPhoneAsync(string phone)
    {
        return await _unitOfWork.Repository<Customer>().GetQueryable()
            .FirstOrDefaultAsync(c => c.Phone == phone);
    }

    public async Task<Customer> CreateOrUpdateCustomerAsync(string phone, string name, string address, string? city = null, string? area = null, string? userId = null)
    {
        var customer = await GetCustomerByPhoneAsync(phone);

        if (customer == null)
        {
            customer = new Customer
            {
                Phone = phone,
                Name = name,
                Address = address,
                City = city,
                Area = area,
                UserId = userId
            };
            _unitOfWork.Repository<Customer>().Add(customer);
        }
        else
        {
            customer.Name = name;
            customer.Address = address;
            customer.City = city ?? customer.City;
            customer.Area = area ?? customer.Area;
            customer.UpdatedAt = DateTime.UtcNow;
            if (userId != null)
                customer.UserId = userId;
            _unitOfWork.Repository<Customer>().Update(customer);
        }

        await _unitOfWork.Complete();
        return customer;
    }

    public async Task<(List<Customer> Items, int Total)> GetCustomersAsync(string? searchTerm, int page, int pageSize)
    {
        var query = _unitOfWork.Repository<Customer>().GetQueryable();

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
        return await _unitOfWork.Repository<Customer>().GetByIdAsync(id);
    }

    public async Task UpdateCustomerAsync(Customer customer)
    {
        _unitOfWork.Repository<Customer>().Update(customer);
        await _unitOfWork.Complete();
    }

    public async Task FlagCustomerAsync(int id, bool isSuspicious)
    {
        var customer = await GetCustomerByIdAsync(id)
            ?? throw new KeyNotFoundException($"Customer with ID {id} not found.");

        customer.IsSuspicious = isSuspicious;
        _unitOfWork.Repository<Customer>().Update(customer);
        await _unitOfWork.Complete();
    }
}
