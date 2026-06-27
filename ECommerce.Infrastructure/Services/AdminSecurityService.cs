using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class AdminSecurityService : IAdminSecurityService
{
    private readonly IUnitOfWork _unitOfWork;

    public AdminSecurityService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<BlockedIp>> GetBlockedIpsAsync()
    {
        return await _unitOfWork.Repository<BlockedIp>()
            .GetQueryable()
            .OrderByDescending(b => b.BlockedAt)
            .ToListAsync();
    }

    public async Task<BlockedIp> BlockIpAsync(BlockedIp ipToBlock)
    {
        var existing = await _unitOfWork.Repository<BlockedIp>()
            .GetQueryable()
            .FirstOrDefaultAsync(b => b.IpAddress == ipToBlock.IpAddress);

        if (existing != null)
            throw new InvalidOperationException("This IP address is already blocked.");

        var entity = new BlockedIp
        {
            IpAddress = ipToBlock.IpAddress,
            Reason = ipToBlock.Reason,
            BlockedAt = DateTime.UtcNow,
            BlockedBy = ipToBlock.BlockedBy
        };

        _unitOfWork.Repository<BlockedIp>().Add(entity);
        await _unitOfWork.Complete();

        return entity;
    }

    public async Task<BlockedIp> BlockIpAddressAsync(string ipAddress, string? reason, string blockedBy)
    {
        var existing = await _unitOfWork.Repository<BlockedIp>()
            .GetQueryable()
            .FirstOrDefaultAsync(b => b.IpAddress == ipAddress);

        if (existing != null)
            throw new InvalidOperationException("This IP address is already blocked.");

        var entity = new BlockedIp
        {
            IpAddress = ipAddress,
            Reason = reason,
            BlockedAt = DateTime.UtcNow,
            BlockedBy = blockedBy
        };

        _unitOfWork.Repository<BlockedIp>().Add(entity);
        await _unitOfWork.Complete();

        return entity;
    }

    public async Task UnblockIpAsync(int id)
    {
        var entity = await _unitOfWork.Repository<BlockedIp>()
            .GetQueryable()
            .FirstOrDefaultAsync(b => b.Id == id);

        if (entity == null)
            throw new InvalidOperationException($"Blocked IP with ID {id} not found.");

        _unitOfWork.Repository<BlockedIp>().Delete(entity);
        await _unitOfWork.Complete();
    }
}
