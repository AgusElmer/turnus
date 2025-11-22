using Turnus.Api.Contracts.Practices;
using Turnus.Api.Domain;

namespace Turnus.Api.Services;

public interface IPracticeService
{
    Task<IEnumerable<Practice>> GetPracticesAsync(CancellationToken cancellationToken);
    Task<Practice?> GetPracticeByIdAsync(int id, CancellationToken cancellationToken);
    Task<Practice> CreatePracticeAsync(CreatePracticeRequest request, CancellationToken cancellationToken);
    Task<Practice?> UpdatePracticeAsync(int id, UpdatePracticeRequest request, CancellationToken cancellationToken);
    Task<bool> DeletePracticeAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<PracticePrice>> GetPracticePricesAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<PracticePrice>> SetPracticePricesAsync(int id, SetPracticePricesRequest request, CancellationToken cancellationToken);
}
