using System.ComponentModel.DataAnnotations;

namespace Turnus.Api.Contracts.Patients;

public record UpdatePatientRequest(
    [param: Required, MaxLength(80)] string FirstName,
    [param: Required, MaxLength(80)] string LastName,
    [param: Required, MaxLength(20)] string Dni,
    [param: MaxLength(30)] string? PhoneNumber,
    [param: EmailAddress, MaxLength(120)] string? Email,
    int? InsuranceProviderId,
    bool IsActive
);
