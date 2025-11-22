using Turnus.Api.Contracts.Patients;
using Turnus.Api.Domain;

namespace Turnus.Api.Services;

public interface IPatientService
{
    Task<IEnumerable<Patient>> GetPatientsAsync(CancellationToken cancellationToken);
    Task<Patient?> GetPatientByIdAsync(int id, CancellationToken cancellationToken);
    Task<Patient> CreatePatientAsync(CreatePatientRequest request, CancellationToken cancellationToken);
    Task<Patient?> UpdatePatientAsync(int id, UpdatePatientRequest request, CancellationToken cancellationToken);
    Task<bool> DeletePatientAsync(int id, CancellationToken cancellationToken);
}
