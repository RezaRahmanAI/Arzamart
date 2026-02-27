using ECommerce.Core.Entities;

namespace ECommerce.Core.Specifications;

public class CategoriesWithSubCategoriesSpec : BaseSpecification<Category>
{
    public CategoriesWithSubCategoriesSpec()
    {
        AddInclude(x => x.SubCategories);
        AddOrderBy(x => x.DisplayOrder);
    }

    public CategoriesWithSubCategoriesSpec(int id) 
        : base(x => x.Id == id)
    {
        AddInclude(x => x.SubCategories);
    }

    public CategoriesWithSubCategoriesSpec(string name) 
        : base(x => x.Name == name)
    {
        AddInclude(x => x.SubCategories);
    }
}
