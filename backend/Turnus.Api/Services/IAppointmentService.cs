using Turnus.Api.Contracts.Appointments;
using Turnus.Api.Domain;

namespace Turnus.Api.Services;

public interface IAppointmentService
{
    Task<IEnumerable<Appointment>> GetAppointmentsAsync(DateOnly? from, DateOnly? to, int? insuranceProviderId, CancellationToken cancellationToken);
    Task<Appointment?> GetAppointmentByIdAsync(int id, CancellationToken cancellationToken);
    Task<Appointment> CreateAppointmentAsync(CreateAppointmentRequest request, CancellationToken cancellationToken);
    Task<Appointment?> UpdateAppointmentAsync(int id, UpdateAppointmentRequest request, CancellationToken cancellationToken);
    Task<bool> DeleteAppointmentAsync(int id, CancellationToken cancellationToken);
}
