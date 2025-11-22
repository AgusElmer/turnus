using Turnus.Api.Contracts.Insurances;
using Turnus.Api.Domain;

namespace Turnus.Api.Services;

public interface IInsuranceProviderService
{
    Task<IEnumerable<InsuranceProvider>> GetInsuranceProvidersAsync(CancellationToken cancellationToken);
    Task<InsuranceProvider?> GetInsuranceProviderByIdAsync(int id, CancellationToken cancellationToken);
    Task<InsuranceProvider> CreateInsuranceProviderAsync(CreateInsuranceProviderRequest request, CancellationToken cancellationToken);
    Task<InsuranceProvider?> UpdateInsuranceProviderAsync(int id, UpdateInsuranceProviderRequest request, CancellationToken cancellationToken);
    Task<bool> DeleteInsuranceProviderAsync(int id, CancellationToken cancellationToken);
}
