using System;

namespace ECommerce.Core.Entities
{
    public class DailyTraffic : BaseEntity
    {
        public DateOnly Date { get; set; }
        public int PageViews { get; set; }
        public int UniqueVisitors { get; set; }
    }
}
