using Microsoft.EntityFrameworkCore;
using Turnus.Api.Contracts.Insurances;
using Turnus.Api.Data;
using Turnus.Api.Domain;

namespace Turnus.Api.Services;

public class InsuranceProviderService : IInsuranceProviderService
{
    private readonly TurnusDbContext _dbContext;

    public InsuranceProviderService(TurnusDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<InsuranceProvider>> GetInsuranceProvidersAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.InsuranceProviders
            .AsNoTracking()
            .OrderBy(i => i.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<InsuranceProvider?> GetInsuranceProviderByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _dbContext.InsuranceProviders.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task<InsuranceProvider> CreateInsuranceProviderAsync(CreateInsuranceProviderRequest request, CancellationToken cancellationToken)
    {
        var provider = new InsuranceProvider
        {
            Name = request.Name.Trim(),
            BillingCode = request.BillingCode?.Trim(),
            ContactEmail = request.ContactEmail?.Trim(),
            ContactPhone = request.ContactPhone?.Trim(),
            Notes = request.Notes?.Trim()
        };

        _dbContext.InsuranceProviders.Add(provider);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return provider;
    }

    public async Task<InsuranceProvider?> UpdateInsuranceProviderAsync(int id, UpdateInsuranceProviderRequest request, CancellationToken cancellationToken)
    {
        var provider = await _dbContext.InsuranceProviders.FindAsync(new object[] { id }, cancellationToken);
        if (provider is null)
        {
            return null;
        }

        provider.Name = request.Name.Trim();
        provider.BillingCode = request.BillingCode?.Trim();
        provider.ContactEmail = request.ContactEmail?.Trim();
        provider.ContactPhone = request.ContactPhone?.Trim();
        provider.Notes = request.Notes?.Trim();
        provider.IsActive = request.IsActive;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return provider;
    }

    public async Task<bool> DeleteInsuranceProviderAsync(int id, CancellationToken cancellationToken)
    {
        var provider = await _dbContext.InsuranceProviders.FindAsync(new object[] { id }, cancellationToken);
        if (provider is null)
        {
            return false;
        }

        var inUse = await _dbContext.Patients.AnyAsync(p => p.InsuranceProviderId == id, cancellationToken)
                     || await _dbContext.Appointments.AnyAsync(a => a.InsuranceProviderId == id, cancellationToken);

        if (inUse)
        {
            throw new InvalidOperationException("The insurance provider is referenced by patients or appointments. Disable it instead.");
        }

        _dbContext.InsuranceProviders.Remove(provider);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
