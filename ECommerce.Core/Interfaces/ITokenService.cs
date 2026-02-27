using ECommerce.Core.Entities;

namespace ECommerce.Core.Interfaces
{
    public interface ITokenService
    {
        string CreateToken(ApplicationUser user, string role);
    }
}
