using Microsoft.EntityFrameworkCore;
using Turnus.Api.Contracts.Practices;
using Turnus.Api.Data;
using Turnus.Api.Domain;

namespace Turnus.Api.Services;

public class PracticeService : IPracticeService
{
    private readonly TurnusDbContext _dbContext;

    public PracticeService(TurnusDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<Practice>> GetPracticesAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.Practices
            .Include(p => p.Prices)
                .ThenInclude(price => price.InsuranceProvider)
            .AsNoTracking()
            .OrderBy(p => p.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Practice?> GetPracticeByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _dbContext.Practices
            .Include(p => p.Prices)
                .ThenInclude(price => price.InsuranceProvider)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<Practice> CreatePracticeAsync(CreatePracticeRequest request, CancellationToken cancellationToken)
    {
        var practice = new Practice
        {
            Name = request.Name.Trim(),
            BillingCode = request.BillingCode.Trim(),
            Description = request.Description?.Trim(),
            DefaultPrice = request.DefaultPrice
        };

        _dbContext.Practices.Add(practice);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _dbContext.PracticePrices.Add(new PracticePrice
        {
            PracticeId = practice.Id,
            Price = practice.DefaultPrice
        });
        await _dbContext.SaveChangesAsync(cancellationToken);

        var created = await _dbContext.Practices
            .Include(p => p.Prices)
                .ThenInclude(price => price.InsuranceProvider)
            .AsNoTracking()
            .FirstAsync(p => p.Id == practice.Id, cancellationToken);

        return created;
    }

    public async Task<Practice?> UpdatePracticeAsync(int id, UpdatePracticeRequest request, CancellationToken cancellationToken)
    {
        var practice = await _dbContext.Practices.FindAsync(new object[] { id }, cancellationToken);
        if (practice is null)
        {
            return null;
        }

        practice.Name = request.Name.Trim();
        practice.BillingCode = request.BillingCode.Trim();
        practice.Description = request.Description?.Trim();
        practice.DefaultPrice = request.DefaultPrice;
        practice.IsActive = request.IsActive;

        await _dbContext.SaveChangesAsync(cancellationToken);

        await _dbContext.Entry(practice)
            .Collection(p => p.Prices)
            .Query()
            .Include(price => price.InsuranceProvider)
            .LoadAsync(cancellationToken);

        return practice;
    }

    public async Task<bool> DeletePracticeAsync(int id, CancellationToken cancellationToken)
    {
        var practice = await _dbContext.Practices.FindAsync(new object[] { id }, cancellationToken);
        if (practice is null)
        {
            return false;
        }

        var inUse = await _dbContext.Appointments.AnyAsync(a => a.PracticeId == id, cancellationToken);
        if (inUse)
        {
            throw new InvalidOperationException("Practice is used in appointments. Disable it instead of deleting.");
        }

        _dbContext.Practices.Remove(practice);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IEnumerable<PracticePrice>> GetPracticePricesAsync(int id, CancellationToken cancellationToken)
    {
        var practice = await _dbContext.Practices
            .Include(p => p.Prices)
                .ThenInclude(price => price.InsuranceProvider)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        return practice?.Prices ?? Enumerable.Empty<PracticePrice>();
    }

    public async Task<IEnumerable<PracticePrice>> SetPracticePricesAsync(int id, SetPracticePricesRequest request, CancellationToken cancellationToken)
    {
        var practice = await _dbContext.Practices
            .Include(p => p.Prices)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (practice is null)
        {
            throw new KeyNotFoundException("Practice not found");
        }

        var defaultPriceInput = request.Prices.FirstOrDefault(price => price.InsuranceProviderId is null);
        if (defaultPriceInput is null)
        {
            throw new ArgumentException("Debe definir al menos un precio para pacientes particulares.");
        }

        var insuranceIds = request.Prices
            .Where(price => price.InsuranceProviderId.HasValue)
            .Select(price => price.InsuranceProviderId!.Value)
            .Distinct()
            .ToList();

        var activeInsurances = await _dbContext.InsuranceProviders
            .Where(i => insuranceIds.Contains(i.Id))
            .ToListAsync(cancellationToken);

        if (activeInsurances.Count != insuranceIds.Count)
        {
            throw new ArgumentException("Una o más obras sociales no existen.");
        }

        var existingPrices = practice.Prices.ToList();

        foreach (var priceInput in request.Prices)
        {
            var match = existingPrices.FirstOrDefault(p => p.InsuranceProviderId == priceInput.InsuranceProviderId);
            if (match is null)
            {
                practice.Prices.Add(new PracticePrice
                {
                    Price = priceInput.Price,
                    InsuranceProviderId = priceInput.InsuranceProviderId,
                    PracticeId = practice.Id
                });
            }
            else
            {
                match.Price = priceInput.Price;
            }
        }
        
        practice.DefaultPrice = defaultPriceInput.Price;

        var idsToKeep = request.Prices.Select(price => price.InsuranceProviderId).ToHashSet();
        var toRemove = existingPrices.Where(price => !idsToKeep.Contains(price.InsuranceProviderId)).ToList();
        if (toRemove.Any())
        {
            _dbContext.PracticePrices.RemoveRange(toRemove);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await _dbContext.PracticePrices
            .Where(price => price.PracticeId == id)
            .Include(price => price.InsuranceProvider)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }
}
