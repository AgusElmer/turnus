using Turnus.Api.Domain;

namespace Turnus.Api.Contracts.Patients;

public record PatientDto(
    int Id,
    string FirstName,
    string LastName,
    string FullName,
    string Dni,
    bool IsActive,
    int? InsuranceProviderId,
    string? InsuranceProviderName,
    string? PhoneNumber,
    string? Email
)
{
    public static PatientDto FromEntity(Patient patient) => new(
        patient.Id,
        patient.FirstName,
        patient.LastName,
        $"{patient.FirstName} {patient.LastName}".Trim(),
        patient.Dni,
        patient.IsActive,
        patient.InsuranceProviderId,
        patient.InsuranceProvider?.Name,
        patient.PhoneNumber,
        patient.Email
    );
}
