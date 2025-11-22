using Microsoft.EntityFrameworkCore;
using Turnus.Api.Contracts.Patients;
using Turnus.Api.Data;
using Turnus.Api.Domain;

namespace Turnus.Api.Services;

public class PatientService : IPatientService
{
    private readonly TurnusDbContext _dbContext;

    public PatientService(TurnusDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<Patient>> GetPatientsAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.Patients
            .Include(p => p.InsuranceProvider)
            .AsNoTracking()
            .OrderBy(p => p.LastName)
            .ThenBy(p => p.FirstName)
            .ToListAsync(cancellationToken);
    }

    public async Task<Patient?> GetPatientByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _dbContext.Patients
            .Include(p => p.InsuranceProvider)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<Patient> CreatePatientAsync(CreatePatientRequest request, CancellationToken cancellationToken)
    {
        var patient = new Patient
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Dni = request.Dni.Trim(),
            PhoneNumber = request.PhoneNumber?.Trim(),
            Email = request.Email?.Trim(),
            InsuranceProviderId = request.InsuranceProviderId
        };

        _dbContext.Patients.Add(patient);
        await _dbContext.SaveChangesAsync(cancellationToken);

        await _dbContext.Entry(patient).Reference(p => p.InsuranceProvider).LoadAsync(cancellationToken);

        return patient;
    }

    public async Task<Patient?> UpdatePatientAsync(int id, UpdatePatientRequest request, CancellationToken cancellationToken)
    {
        var patient = await _dbContext.Patients.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (patient is null)
        {
            return null;
        }

        patient.FirstName = request.FirstName.Trim();
        patient.LastName = request.LastName.Trim();
        patient.Dni = request.Dni.Trim();
        patient.PhoneNumber = request.PhoneNumber?.Trim();
        patient.Email = request.Email?.Trim();
        patient.InsuranceProviderId = request.InsuranceProviderId;
        patient.IsActive = request.IsActive;
        patient.UpdatedAtUtc = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        
        await _dbContext.Entry(patient).Reference(p => p.InsuranceProvider).LoadAsync(cancellationToken);

        return patient;
    }

    public async Task<bool> DeletePatientAsync(int id, CancellationToken cancellationToken)
    {
        var patient = await _dbContext.Patients.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (patient is null)
        {
            return false;
        }

        var hasAppointments = await _dbContext.Appointments.AnyAsync(a => a.PatientId == id, cancellationToken);
        if (hasAppointments)
        {
            throw new InvalidOperationException("The patient has appointments assigned. Disable it instead of deleting.");
        }

        _dbContext.Patients.Remove(patient);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
