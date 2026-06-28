using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace ECommerce.API.Middleware;

public class PermissionPolicyProvider : DefaultAuthorizationPolicyProvider
{
    private static readonly Regex PermissionFormat = new(@"^[a-z][a-z0-9-]*:[a-z][a-z0-9-*]+$", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public PermissionPolicyProvider(IOptions<AuthorizationOptions> options) : base(options)
    {
    }

    public override async Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        var policy = await base.GetPolicyAsync(policyName);

        if (policy == null && PermissionFormat.IsMatch(policyName))
        {
            policy = new AuthorizationPolicyBuilder()
                .AddRequirements(new PermissionRequirement(policyName))
                .Build();
        }

        return policy;
    }
}
