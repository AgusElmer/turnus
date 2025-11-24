using Turnus.Api.Domain;

namespace Turnus.Api.Contracts.Appointments;

public record AppointmentDto(
    int Id,
    DateOnly ServiceDate,
    TimeOnly ServiceTime,
    int DurationMinutes,
    AppointmentStatus Status,
    decimal? CustomPrice,
    decimal Amount,
    string? Notes,
    int PatientId,
    string PatientName,
    int PracticeId,
    string PracticeName,
    int? InsuranceProviderId,
    string? InsuranceProviderName
)
{
    public static AppointmentDto FromEntity(Appointment appointment)
    {
        return new AppointmentDto(
            appointment.Id,
            appointment.ServiceDate,
            appointment.ServiceTime,
            appointment.DurationMinutes,
            appointment.Status,
            appointment.CustomPrice,
            appointment.BilledAmount,
            appointment.Notes,
            appointment.PatientId,
            $"{appointment.Patient.FirstName} {appointment.Patient.LastName}".Trim(),
            appointment.PracticeId,
            appointment.Practice.Name,
            appointment.InsuranceProviderId,
            appointment.InsuranceProvider?.Name
        );
    }
}
