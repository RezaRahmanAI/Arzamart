using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace ECommerce.Infrastructure.Services;

public static class PasswordEncryption
{
    public static string Encrypt(string plain, string key)
    {
        if (string.IsNullOrEmpty(plain)) return string.Empty;
        if (string.IsNullOrEmpty(key)) throw new ArgumentNullException(nameof(key), "Encryption key cannot be null or empty.");

        // Derive 32-byte key from the provided key string (using SHA256)
        byte[] keyBytes = SHA256.HashData(Encoding.UTF8.GetBytes(key));

        using var aes = Aes.Create();
        aes.Key = keyBytes;
        aes.GenerateIV();
        byte[] iv = aes.IV;

        using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        using var ms = new MemoryStream();

        // Write IV first (16 bytes)
        ms.Write(iv, 0, iv.Length);

        using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
        {
            byte[] plainBytes = Encoding.UTF8.GetBytes(plain);
            cs.Write(plainBytes, 0, plainBytes.Length);
            cs.FlushFinalBlock();
        }

        return Convert.ToBase64String(ms.ToArray());
    }

    public static string Decrypt(string cipher, string key)
    {
        if (string.IsNullOrEmpty(cipher)) return string.Empty;
        if (string.IsNullOrEmpty(key)) throw new ArgumentNullException(nameof(key), "Decryption key cannot be null or empty.");

        byte[] keyBytes = SHA256.HashData(Encoding.UTF8.GetBytes(key));
        byte[] cipherBytes = Convert.FromBase64String(cipher);

        using var aes = Aes.Create();
        aes.Key = keyBytes;

        byte[] iv = new byte[16];
        if (cipherBytes.Length < 16) throw new InvalidOperationException("Invalid ciphertext length.");
        Array.Copy(cipherBytes, 0, iv, 0, 16);
        aes.IV = iv;

        using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
        using var ms = new MemoryStream();
        using (var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Write))
        {
            cs.Write(cipherBytes, 16, cipherBytes.Length - 16);
            cs.FlushFinalBlock();
        }

        return Encoding.UTF8.GetString(ms.ToArray());
    }
}
