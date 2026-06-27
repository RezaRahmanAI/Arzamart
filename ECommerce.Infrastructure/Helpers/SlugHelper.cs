using System;
using System.Text.RegularExpressions;

namespace ECommerce.Infrastructure.Helpers;

public static partial class SlugHelper
{
    public static string GenerateSlug(string name)
    {
        if (string.IsNullOrEmpty(name))
            return Guid.NewGuid().ToString()[..8];

        var slug = name.ToLower().Trim();
        slug = slug.Replace('&', 'a').Replace(" and ", "-");
        slug = NonAlphaNumeric().Replace(slug, "");
        slug = MultipleHyphens().Replace(slug, "-").Trim('-');

        if (slug.Length > 150)
            slug = slug[..150].Trim('-');

        return string.IsNullOrEmpty(slug) ? Guid.NewGuid().ToString()[..8] : slug;
    }

    [GeneratedRegex("[^a-z0-9\\s-]")]
    private static partial Regex NonAlphaNumeric();

    [GeneratedRegex("[-]+")]
    private static partial Regex MultipleHyphens();
}
