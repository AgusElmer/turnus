using Turnus.Api.Domain;

namespace Turnus.Api.Contracts.Insurances;

public record InsuranceProviderDto(
    int Id,
    string Name,
    string? BillingCode,
    string? ContactEmail,
    string? ContactPhone,
    string? Notes,
    bool IsActive
)
{
    public static InsuranceProviderDto FromEntity(InsuranceProvider insurance) => new(
        insurance.Id,
        insurance.Name,
        insurance.BillingCode,
        insurance.ContactEmail,
        insurance.ContactPhone,
        insurance.Notes,
        insurance.IsActive
    );
}
