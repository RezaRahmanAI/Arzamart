using ECommerce.Core.Entities;

namespace ECommerce.Core.Specifications;

public class ProductsWithCategoriesSpecification : BaseSpecification<Product>
{
    public ProductsWithCategoriesSpecification(string? sort, int? categoryId, int? subCategoryId, int? collectionId, string? categorySlug, string? subCategorySlug, string? collectionSlug, string? search, string? tier, string? tags, bool? isNew = null, bool? isFeatured = null, int? skip = null, int? take = null)
        : base(x => 
            (string.IsNullOrEmpty(search) || x.Name.ToLower().Contains(search.ToLower()) || (x.Description != null && x.Description.ToLower().Contains(search.ToLower()))) &&
            (!categoryId.HasValue || x.CategoryId == categoryId) &&
            (!subCategoryId.HasValue || x.SubCategoryId == subCategoryId) &&
            (!collectionId.HasValue || x.CollectionId == collectionId) &&
            (string.IsNullOrEmpty(categorySlug) || x.Category.Slug == categorySlug) &&
            (string.IsNullOrEmpty(subCategorySlug) || (x.SubCategory != null && x.SubCategory.Slug == subCategorySlug)) &&
            (string.IsNullOrEmpty(collectionSlug) || (x.Collection != null && x.Collection.Slug == collectionSlug)) &&
            (string.IsNullOrEmpty(tier) || x.Tier == tier) &&
            (string.IsNullOrEmpty(tags) || (x.Tags != null && x.Tags.ToLower().Contains(tags.ToLower()))) &&
            (!isNew.HasValue || x.IsNew == isNew.Value) &&
            (!isFeatured.HasValue || x.IsFeatured == isFeatured.Value)
        )

    {
        AddInclude(x => x.Category);
        AddInclude(x => x.SubCategory!);
        AddInclude(x => x.Collection!);
        AddInclude(x => x.Images);
        AddInclude(x => x.Variants);
        AddInclude(x => x.BundleItems);
        AddInclude("BundleItems.ComponentProduct");
        AddInclude("BundleItems.ComponentVariant");

        AddOrderBy(x => x.Name);

        if (!string.IsNullOrEmpty(sort))
        {
            switch (sort)
            {
                case "priceAsc":
                    AddOrderBy(p => p.Name);
                    break;
                case "priceDesc":
                    AddOrderByDescending(p => p.Name);
                    break;
                case "sortOrder":
                    AddOrderBy(p => p.SortOrder);
                    break;
                case "sortOrderDesc":
                    AddOrderByDescending(p => p.SortOrder);
                    break;
                default:
                    AddOrderBy(n => n.Name);
                    break;
            }
        }

        if (skip.HasValue && take.HasValue)
        {
            ApplyPaging(skip.Value, take.Value);
        }
    }

    public ProductsWithCategoriesSpecification(int id) 
        : base(x => x.Id == id)
    {
        AddIncludes();
    }

    public ProductsWithCategoriesSpecification(string slug) 
        : base(x => x.Slug == slug)
    {
        AddIncludes();
    }



    private void AddIncludes()
    {
        AddInclude(x => x.Category);
        AddInclude(x => x.SubCategory!);
        AddInclude(x => x.Collection!);
        AddInclude(x => x.Images);
        AddInclude(x => x.Variants);
        AddInclude(x => x.BundleItems);
        AddInclude("BundleItems.ComponentProduct");
        AddInclude("BundleItems.ComponentVariant");
    }
}
