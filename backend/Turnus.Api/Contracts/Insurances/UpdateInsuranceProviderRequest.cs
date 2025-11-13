using System.ComponentModel.DataAnnotations;

namespace Turnus.Api.Contracts.Insurances;

public record UpdateInsuranceProviderRequest(
    [param: Required, MaxLength(120)] string Name,
    [param: MaxLength(30)] string? BillingCode,
    [param: EmailAddress, MaxLength(120)] string? ContactEmail,
    [param: MaxLength(30)] string? ContactPhone,
    [param: MaxLength(250)] string? Notes,
    bool IsActive
);
