using System.Threading.Tasks;
using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface INavigationService
{
    Task<MegaMenuDto> GetMegaMenuAsync();
}
