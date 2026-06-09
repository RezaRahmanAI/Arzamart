using System;

namespace ECommerce.Core.Domain.Common;

/// <summary>
/// Base exception for all domain-level business logic violations.
/// These exceptions represent violations of business rules, not infrastructure issues.
/// </summary>
public class DomainException : Exception
{
    public string? Code { get; }
    public string? Details { get; }

    public DomainException(string message) : base(message)
    {
    }

    public DomainException(string message, string code) : base(message)
    {
        Code = code;
    }

    public DomainException(string message, string code, string details) : base(message)
    {
        Code = code;
        Details = details;
    }

    public DomainException(string message, Exception innerException) 
        : base(message, innerException)
    {
    }
}
