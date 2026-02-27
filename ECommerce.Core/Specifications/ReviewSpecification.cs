using System.Linq.Expressions;
using ECommerce.Core.Entities;

namespace ECommerce.Core.Specifications;

public class ReviewSpecification : BaseSpecification<Review>
{
    public ReviewSpecification(int productId) 
        : base(r => r.ProductId == productId && r.IsApproved)
    {
        AddInclude(r => r.Product);
        AddOrderByDescending(r => r.Date);
    }

    public ReviewSpecification(bool isFeatured) 
        : base(r => r.IsFeatured && r.IsApproved)
    {
        AddInclude(r => r.Product);
        AddOrderByDescending(r => r.Date);
        ApplyPaging(0, 6); // Top 6 featured reviews
    }
}
