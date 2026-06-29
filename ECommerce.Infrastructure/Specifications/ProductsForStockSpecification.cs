using System.Collections.Generic;
using System.Linq;
using ECommerce.Core.Entities;

namespace ECommerce.Infrastructure.Specifications;

public class ProductsForStockSpecification : BaseSpecification<Product>
{
    public ProductsForStockSpecification(int id) 
        : base(x => x.Id == id)
    {
        AddIncludes();
    }

    public ProductsForStockSpecification(IEnumerable<int> ids)
        : base(x => ids.Contains(x.Id))
    {
        AddIncludes();
    }

    private void AddIncludes()
    {
        AddInclude(x => x.Variants);
        AddInclude("ComboItems.Product");
        AddInclude("ComboItems.ProductVariant");
    }
}
