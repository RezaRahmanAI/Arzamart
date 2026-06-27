namespace ECommerce.Core.Constants;

/// <summary>
/// Product status constants
/// </summary>
public static class ProductStatus
{
    public const string Active = "Active";
    public const string Draft = "Draft";
    public const string Archived = "Archived";
}

/// <summary>
/// Product gender/category constants
/// </summary>
public static class ProductGender
{
    public const string Men = "men";
    public const string Women = "women";
    public const string Kids = "kids";
    public const string Accessories = "accessories";
}

/// <summary>
/// User role constants
/// </summary>
public static class UserRoles
{
    public const string Admin = "admin";
    public const string User = "user";
    public const string Customer = "customer";
}

/// <summary>
/// Application-wide configuration constants
/// </summary>
public static class AppConstants
{
    /// <summary>
    /// Base number for order number generation (OrderNumber = OrderId + OrderNumberBase)
    /// </summary>
    public const int OrderNumberBase = 16000;

    /// <summary>
    /// Maximum request body size in bytes (100 MB)
    /// </summary>
    public const long MaxRequestBodySize = 104_857_600;

    /// <summary>
    /// Default session expiry in days for guest carts
    /// </summary>
    public const int GuestSessionExpiryDays = 7;

    /// <summary>
    /// JWT token clock skew tolerance in minutes
    /// </summary>
    public const int JwtClockSkewMinutes = 5;
}

/// <summary>
/// Cache duration constants
/// </summary>
public static class CacheDurations
{
    /// <summary>
    /// Medium cache duration - 10 minutes
    /// </summary>
    public static readonly TimeSpan Medium = TimeSpan.FromMinutes(10);

    /// <summary>
    /// Long cache duration - 30 minutes
    /// </summary>
    public static readonly TimeSpan Long = TimeSpan.FromMinutes(30);

    /// <summary>
    /// Extended cache duration - 60 minutes
    /// </summary>
    public static readonly TimeSpan Extended = TimeSpan.FromMinutes(60);

}

/// <summary>
/// Rate limiting constants
/// </summary>
public static class RateLimits
{
    /// <summary>
    /// Fixed window limiter: requests per window
    /// </summary>
    public const int FixedWindowPermitLimit = 100;

    /// <summary>
    /// Fixed window limiter: window duration
    /// </summary>
    public static readonly TimeSpan FixedWindowDuration = TimeSpan.FromMinutes(1);

    /// <summary>
    /// Fixed window limiter: queue limit
    /// </summary>
    public const int FixedWindowQueueLimit = 20;

    /// <summary>
    /// Sliding window limiter: requests per window
    /// </summary>
    public const int SlidingWindowPermitLimit = 50;

    /// <summary>
    /// Sliding window limiter: window duration
    /// </summary>
    public static readonly TimeSpan SlidingWindowDuration = TimeSpan.FromSeconds(10);

    /// <summary>
    /// Sliding window limiter: segments per window
    /// </summary>
    public const int SlidingWindowSegments = 5;

    /// <summary>
    /// Sliding window limiter: queue limit
    /// </summary>
    public const int SlidingWindowQueueLimit = 10;
}

/// <summary>
/// File upload constants
/// </summary>
public static class FileUpload
{
    /// <summary>
    /// Maximum file upload size in bytes (100 MB)
    /// </summary>
    public const long MaxFileSize = 104_857_600;

    /// <summary>
    /// Products upload folder name
    /// </summary>
    public const string ProductsFolder = "products";

    /// <summary>
    /// Banners upload folder name
    /// </summary>
    public const string BannersFolder = "banners";

    /// <summary>
    /// Categories upload folder name
    /// </summary>
    public const string CategoriesFolder = "categories";
}

/// <summary>
/// Claim type constants
/// </summary>
public static class ClaimTypes
{
    public const string IsSuperAdmin = "is_super_admin";
    public const string AllowedMenus = "allowed_menus";
}