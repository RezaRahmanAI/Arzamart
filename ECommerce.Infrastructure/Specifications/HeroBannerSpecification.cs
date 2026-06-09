using System.Linq.Expressions;
using ECommerce.Core.Entities;

namespace ECommerce.Infrastructure.Specifications;

public class HeroBannerSpecification : BaseSpecification<HeroBanner>
{
    public HeroBannerSpecification(bool isActive) 
        : base(b => b.IsActive == isActive)
    {
        AddOrderBy(b => b.DisplayOrder);
    }
}
