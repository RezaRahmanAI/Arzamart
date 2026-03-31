using System.Text.Json.Serialization;

namespace ECommerce.Core.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum BannerType
{
    Hero = 0,
    Promo = 1,
    Spotlight = 2
}
