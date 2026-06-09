using System.Collections.Generic;

namespace ECommerce.Core.DTOs;

public class PagedResponseDto<T>
{
    public IReadOnlyList<T> Items { get; set; } = new List<T>();
    public int Total { get; set; }
}
