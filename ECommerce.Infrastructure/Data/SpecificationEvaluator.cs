using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Data;

public class SpecificationEvaluator<T> where T : BaseEntity
{
    public static IQueryable<T> GetQuery(IQueryable<T> inputQuery, ISpecification<T> spec, bool evaluateIncludes = true)
    {
        var query = inputQuery;

        if (spec.Criteria != null)
        {
            query = query.Where(spec.Criteria);
        }

        if (spec.OrderBy != null)
        {
            query = query.OrderBy(spec.OrderBy);
        }
        else if (spec.OrderByDescending != null)
        {
            query = query.OrderByDescending(spec.OrderByDescending);
        }
        else
        {
            query = query.OrderBy(x => x.Id);
        }

        if (evaluateIncludes)
        {
            query = spec.Includes.Aggregate(query, (current, include) => current.Include(include));
            query = spec.IncludesStrings.Aggregate(query, (current, include) => current.Include(include));
        }

        if (spec.IsPagingEnabled)
        {
            query = query.Skip(spec.Skip).Take(spec.Take);
        }

        // Use split queries when there are multiple includes to prevent cartesian explosion
        if (evaluateIncludes && spec.Includes.Any())
        {
            query = query.AsSplitQuery();
        }

        return query;
    }
}
