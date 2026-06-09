namespace ECommerce.Core.Interfaces;

public interface IOrderNumberGenerator
{
    string Generate(int orderId);
}