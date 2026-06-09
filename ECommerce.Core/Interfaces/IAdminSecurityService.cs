using ECommerce.Core.Entities;

namespace ECommerce.Core.Interfaces;

public interface IAdminSecurityService
{
    Task<List<BlockedIp>> GetBlockedIpsAsync();
    Task<BlockedIp> BlockIpAsync(BlockedIp ipToBlock);
    Task UnblockIpAsync(int id);
}
