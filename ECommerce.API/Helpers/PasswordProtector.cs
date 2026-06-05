using Microsoft.AspNetCore.DataProtection;

namespace ECommerce.API.Helpers;

public class PasswordProtector
{
    private readonly IDataProtector _protector;

    public PasswordProtector(IDataProtectionProvider provider)
    {
        _protector = provider.CreateProtector("ECommerce.Admin.Password.v1");
    }

    public string Encrypt(string plainText)
    {
        return _protector.Protect(plainText);
    }

    public string Decrypt(string cipherText)
    {
        return _protector.Unprotect(cipherText);
    }
}
