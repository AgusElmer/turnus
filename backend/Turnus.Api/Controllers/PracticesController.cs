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
            .AsNoTracking()
            .OrderBy(p => p.Name)
            .ToListAsync(cancellationToken);

        return Ok(practices.Select(PracticeDto.FromEntity));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PracticeDto>> GetPracticeByIdAsync(int id, CancellationToken cancellationToken)
    {
        var practice = await _dbContext.Practices.FindAsync([id], cancellationToken);
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

        return Created($"/api/practices/{practice.Id}", PracticeDto.FromEntity(practice));
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
}
