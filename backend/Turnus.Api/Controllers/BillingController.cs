using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Turnus.Api.Contracts.Billing;
using Turnus.Api.Data;

namespace Turnus.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BillingController(TurnusDbContext dbContext) : ControllerBase
{
    private readonly TurnusDbContext _dbContext = dbContext;

    [HttpGet("monthly")]
    public async Task<ActionResult<BillingSummaryDto>> GetMonthlyAsync([FromQuery] int year, [FromQuery] int month, CancellationToken cancellationToken)
    {
        if (year < 2000 || year > 2100 || month is < 1 or > 12)
        {
            return BadRequest("Invalid month or year.");
        }

        var startDate = new DateOnly(year, month, 1);
        var endDate = startDate.AddMonths(1).AddDays(-1);

        var completedAppointments = await _dbContext.Appointments
            .Include(a => a.Practice)
            .Include(a => a.InsuranceProvider)
            .Where(a => a.Status == Domain.AppointmentStatus.Completed)
            .Where(a => a.ServiceDate >= startDate && a.ServiceDate <= endDate)
            .ToListAsync(cancellationToken);

        var grouped = completedAppointments
            .GroupBy(a => a.InsuranceProviderId ?? 0)
            .Select(group =>
            {
                var providerName = group.First().InsuranceProvider?.Name ?? "Particular";
                var providerId = group.Key;

                var practiceGroups = group
                    .GroupBy(a => a.PracticeId)
                    .Select(practiceGroup => new BillingPracticeBreakdownDto(
                        practiceGroup.Key,
                        practiceGroup.First().Practice.Name,
                        practiceGroup.Count(),
                        practiceGroup.Sum(a => a.BilledAmount)
                    ))
                    .ToList();

                var providerTotal = practiceGroups.Sum(p => p.Amount);

                return new BillingProviderSummaryDto(
                    providerId,
                    providerName,
                    providerTotal,
                    practiceGroups
                );
            })
            .ToList();

        var total = grouped.Sum(g => g.TotalAmount);

        var response = new BillingSummaryDto(year, month, grouped, total);
        return Ok(response);
    }
}
