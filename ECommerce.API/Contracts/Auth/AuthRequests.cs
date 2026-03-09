namespace ECommerce.API.Contracts.Auth;

public record LoginRequest(string Identifier, string Password, bool RememberMe);

public record SignupRequest(
    string FullName,
    string Email,
    string Password,
    string PhoneNumber);

public record AuthResponse(string Token, UserSummary User);

public record UserSummary(
    string Id,
    string FullName,
    string Email,
    string Role,
    string? PhoneNumber);
