using System.ComponentModel.DataAnnotations;

namespace Turnus.Api.Contracts.Patients;

public record CreatePatientRequest(
    [param: Required, MaxLength(80)] string FirstName,
    [param: Required, MaxLength(80)] string LastName,
    [param: Required, MaxLength(20)] string Dni,
    [param: MaxLength(30)] string? PhoneNumber,
    [param: MaxLength(120)] string? Email,
    int? InsuranceProviderId
);
