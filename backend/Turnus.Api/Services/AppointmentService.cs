using Microsoft.EntityFrameworkCore;
using Turnus.Api.Contracts.Appointments;
using Turnus.Api.Data;
using Turnus.Api.Domain;
using Turnus.Api.Options;

namespace Turnus.Api.Services;

public class AppointmentService : IAppointmentService
{
    private readonly TurnusDbContext _dbContext;
    private readonly AppointmentOptions _appointmentOptions;

    public AppointmentService(TurnusDbContext dbContext, AppointmentOptions appointmentOptions)
    {
        _dbContext = dbContext;
        _appointmentOptions = appointmentOptions;
    }

    public async Task<IEnumerable<Appointment>> GetAppointmentsAsync(DateOnly? from, DateOnly? to, int? insuranceProviderId, CancellationToken cancellationToken)
    {
        var query = _dbContext.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Practice)
            .Include(a => a.InsuranceProvider)
            .AsNoTracking()
            .AsQueryable();

        if (from.HasValue)
        {
            query = query.Where(a => a.ServiceDate >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(a => a.ServiceDate <= to.Value);
        }

        if (insuranceProviderId.HasValue)
        {
            query = query.Where(a => a.InsuranceProviderId == insuranceProviderId.Value);
        }

        return await query
            .OrderBy(a => a.ServiceDate)
            .ThenBy(a => a.ServiceTime)
            .ThenBy(a => a.Patient.LastName)
            .ToListAsync(cancellationToken);
    }

    public async Task<Appointment?> GetAppointmentByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _dbContext.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Practice)
            .Include(a => a.InsuranceProvider)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public async Task<Appointment> CreateAppointmentAsync(CreateAppointmentRequest request, CancellationToken cancellationToken)
    {
        var patient = await _dbContext.Patients.FirstAsync(p => p.Id == request.PatientId, cancellationToken);
        var practice = await _dbContext.Practices.FirstAsync(p => p.Id == request.PracticeId, cancellationToken);

        int? appointmentInsuranceProviderId = request.UsePatientInsurance ? (request.InsuranceProviderId ?? patient.InsuranceProviderId) : null;
        var billedAmount = request.CustomPrice ?? await ResolveBasePriceAsync(practice.Id, appointmentInsuranceProviderId, cancellationToken);

        var appointment = new Appointment
        {
            PatientId = request.PatientId,
            PracticeId = request.PracticeId,
            InsuranceProviderId = appointmentInsuranceProviderId,
            ServiceDate = request.ServiceDate,
            ServiceTime = request.ServiceTime,
            DurationMinutes = _appointmentOptions.DefaultDurationMinutes,
            Status = request.Status,
            CustomPrice = request.CustomPrice,
            BilledAmount = billedAmount,
            Notes = request.Notes
        };

        _dbContext.Appointments.Add(appointment);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetAppointmentByIdAsync(appointment.Id, cancellationToken) ?? appointment;
    }

    public async Task<Appointment?> UpdateAppointmentAsync(int id, UpdateAppointmentRequest request, CancellationToken cancellationToken)
    {
        var appointment = await _dbContext.Appointments
            .Include(a => a.Patient)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (appointment is null)
        {
            return null;
        }

        appointment.ServiceDate = request.ServiceDate;
        appointment.ServiceTime = request.ServiceTime;
        appointment.DurationMinutes = _appointmentOptions.DefaultDurationMinutes;
        appointment.Status = request.Status;
        appointment.Notes = request.Notes;
        appointment.InsuranceProviderId = request.UsePatientInsurance ? (request.InsuranceProviderId ?? appointment.Patient.InsuranceProviderId) : null;
        appointment.CustomPrice = request.CustomPrice;
        appointment.BilledAmount = request.CustomPrice ?? await ResolveBasePriceAsync(appointment.PracticeId, appointment.InsuranceProviderId, cancellationToken);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetAppointmentByIdAsync(appointment.Id, cancellationToken);
    }

    public async Task<bool> DeleteAppointmentAsync(int id, CancellationToken cancellationToken)
    {
        var appointment = await _dbContext.Appointments.FindAsync(new object[] { id }, cancellationToken);
        if (appointment is null)
        {
            return false;
        }

        _dbContext.Appointments.Remove(appointment);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task<decimal> ResolveBasePriceAsync(int practiceId, int? insuranceProviderId, CancellationToken cancellationToken)
    {
        var exactMatch = await _dbContext.PracticePrices
            .Where(price => price.PracticeId == practiceId && price.InsuranceProviderId == insuranceProviderId)
            .Select(price => (decimal?)price.Price)
            .FirstOrDefaultAsync(cancellationToken);

        if (exactMatch.HasValue)
        {
            return exactMatch.Value;
        }

        var defaultMatch = await _dbContext.PracticePrices
            .Where(price => price.PracticeId == practiceId && price.InsuranceProviderId == null)
            .Select(price => (decimal?)price.Price)
            .FirstOrDefaultAsync(cancellationToken);

        if (defaultMatch.HasValue)
        {
            return defaultMatch.Value;
        }

        return await _dbContext.Practices
            .Where(practice => practice.Id == practiceId)
            .Select(practice => practice.DefaultPrice)
            .FirstAsync(cancellationToken);
    }

}
