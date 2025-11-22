using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Turnus.Api.Contracts.Practices;
using Turnus.Api.Data;
using Turnus.Api.Domain;

namespace Turnus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class PracticesController(TurnusDbContext dbContext) : ControllerBase
{
    private readonly TurnusDbContext _dbContext = dbContext;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PracticeDto>>> GetPracticesAsync(CancellationToken cancellationToken)
    {
        var practices = await _dbContext.Practices
            .Include(p => p.Prices)
                .ThenInclude(price => price.InsuranceProvider)
            .AsNoTracking()
            .OrderBy(p => p.Name)
            .ToListAsync(cancellationToken);

        return Ok(practices.Select(PracticeDto.FromEntity));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PracticeDto>> GetPracticeByIdAsync(int id, CancellationToken cancellationToken)
    {
        var practice = await _dbContext.Practices
            .Include(p => p.Prices)
                .ThenInclude(price => price.InsuranceProvider)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        return practice is null ? NotFound() : Ok(PracticeDto.FromEntity(practice));
    }

    [HttpPost]
    public async Task<ActionResult<PracticeDto>> CreatePracticeAsync(CreatePracticeRequest request, CancellationToken cancellationToken)
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

        return Created($"/api/practices/{practice.Id}", PracticeDto.FromEntity(created));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<PracticeDto>> UpdatePracticeAsync(int id, UpdatePracticeRequest request, CancellationToken cancellationToken)
    {
        var practice = await _dbContext.Practices.FindAsync([id], cancellationToken);
        if (practice is null)
        {
            return NotFound();
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

        return Ok(PracticeDto.FromEntity(practice));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeletePracticeAsync(int id, CancellationToken cancellationToken)
    {
        var practice = await _dbContext.Practices.FindAsync([id], cancellationToken);
        if (practice is null)
        {
            return NotFound();
        }

        var inUse = await _dbContext.Appointments.AnyAsync(a => a.PracticeId == id, cancellationToken);
        if (inUse)
        {
            return Conflict("Practice is used in appointments. Disable it instead of deleting.");
        }

        _dbContext.Practices.Remove(practice);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpGet("{id:int}/prices")]
    public async Task<ActionResult<IEnumerable<PracticePriceDto>>> GetPracticePricesAsync(int id, CancellationToken cancellationToken)
    {
        var practice = await _dbContext.Practices
            .Include(p => p.Prices)
                .ThenInclude(price => price.InsuranceProvider)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (practice is null)
        {
            return NotFound();
        }

        return Ok(practice.Prices.Select(PracticePriceDto.FromEntity));
    }

    [HttpPut("{id:int}/prices")]
    public async Task<ActionResult<IEnumerable<PracticePriceDto>>> SetPracticePricesAsync(int id, SetPracticePricesRequest request, CancellationToken cancellationToken)
    {
        var practice = await _dbContext.Practices
            .Include(p => p.Prices)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (practice is null)
        {
            return NotFound();
        }

        var defaultPriceInput = request.Prices.FirstOrDefault(price => price.InsuranceProviderId is null);
        if (defaultPriceInput is null)
        {
            return BadRequest("Debe definir al menos un precio para pacientes particulares.");
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
            return BadRequest("Una o más obras sociales no existen.");
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
        if (toRemove.Count > 0)
        {
            _dbContext.PracticePrices.RemoveRange(toRemove);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var updatedPrices = await _dbContext.PracticePrices
            .Where(price => price.PracticeId == id)
            .Include(price => price.InsuranceProvider)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return Ok(updatedPrices.Select(PracticePriceDto.FromEntity));
    }
}
