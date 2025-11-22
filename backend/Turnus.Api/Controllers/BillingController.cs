using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Turnus.Api.Contracts.Billing;
using Turnus.Api.Services;

namespace Turnus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class BillingController : ControllerBase
{
    private readonly IBillingService _billingService;

    public BillingController(IBillingService billingService)
    {
        _billingService = billingService;
    }

    [HttpGet("monthly")]
    public async Task<ActionResult<BillingSummaryDto>> GetMonthlyAsync([FromQuery] int year, [FromQuery] int month, CancellationToken cancellationToken)
    {
        if (year < 2000 || year > 2100 || month is < 1 or > 12)
        {
            return BadRequest("Invalid month or year.");
        }

        var startDate = new DateOnly(year, month, 1);
        var endDate = startDate.AddMonths(1).AddDays(-1);

        var summary = await _billingService.GetBillingSummaryAsync(startDate, endDate, cancellationToken);
        return Ok(summary);
    }
}
