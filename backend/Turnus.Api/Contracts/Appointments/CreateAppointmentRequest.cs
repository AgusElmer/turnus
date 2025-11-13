using System.ComponentModel.DataAnnotations;
using Turnus.Api.Domain;

namespace Turnus.Api.Contracts.Appointments;

public record CreateAppointmentRequest(
    [param: Required] int PatientId,
    [param: Required] int PracticeId,
    [param: Required] DateOnly ServiceDate,
    AppointmentStatus Status = AppointmentStatus.Scheduled,
    int? InsuranceProviderId = null,
    [param: Range(0, 1000000)] decimal? CustomPrice = null,
    [param: MaxLength(250)] string? Notes = null
);
