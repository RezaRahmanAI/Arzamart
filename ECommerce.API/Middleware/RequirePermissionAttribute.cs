using System;
using Microsoft.AspNetCore.Authorization;

namespace ECommerce.API.Middleware;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
public class RequirePermissionAttribute : AuthorizeAttribute
{
    public RequirePermissionAttribute(string module, string action)
    {
        Policy = $"{module}:{action}";
    }
}
