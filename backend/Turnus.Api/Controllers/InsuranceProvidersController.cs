using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Turnus.Api.Contracts.Insurances;
using Turnus.Api.Data;
using Turnus.Api.Domain;

namespace Turnus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class InsuranceProvidersController(TurnusDbContext dbContext) : ControllerBase
{
    private readonly TurnusDbContext _dbContext = dbContext;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InsuranceProviderDto>>> GetAsync(CancellationToken cancellationToken)
    {
        var providers = await _dbContext.InsuranceProviders
            .AsNoTracking()
            .OrderBy(i => i.Name)
            .ToListAsync(cancellationToken);

        return Ok(providers.Select(InsuranceProviderDto.FromEntity));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<InsuranceProviderDto>> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var provider = await _dbContext.InsuranceProviders.FindAsync([id], cancellationToken);
        return provider is null ? NotFound() : Ok(InsuranceProviderDto.FromEntity(provider));
    }

    [HttpPost]
    public async Task<ActionResult<InsuranceProviderDto>> CreateAsync(CreateInsuranceProviderRequest request, CancellationToken cancellationToken)
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

        return Created($"/api/insuranceproviders/{provider.Id}", InsuranceProviderDto.FromEntity(provider));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<InsuranceProviderDto>> UpdateAsync(int id, UpdateInsuranceProviderRequest request, CancellationToken cancellationToken)
    {
        var provider = await _dbContext.InsuranceProviders.FindAsync([id], cancellationToken);
        if (provider is null)
        {
            return NotFound();
        }

        provider.Name = request.Name.Trim();
        provider.BillingCode = request.BillingCode?.Trim();
        provider.ContactEmail = request.ContactEmail?.Trim();
        provider.ContactPhone = request.ContactPhone?.Trim();
        provider.Notes = request.Notes?.Trim();
        provider.IsActive = request.IsActive;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(InsuranceProviderDto.FromEntity(provider));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var provider = await _dbContext.InsuranceProviders.FindAsync([id], cancellationToken);
        if (provider is null)
        {
            return NotFound();
        }

        var inUse = await _dbContext.Patients.AnyAsync(p => p.InsuranceProviderId == id, cancellationToken)
                     || await _dbContext.Appointments.AnyAsync(a => a.InsuranceProviderId == id, cancellationToken);

        if (inUse)
        {
            return Conflict("The insurance provider is referenced by patients or appointments. Disable it instead.");
        }

        _dbContext.InsuranceProviders.Remove(provider);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
