using Turnus.Api.Contracts.Billing;

namespace Turnus.Api.Services;

public interface IBillingService
{
    Task<BillingSummaryDto> GetBillingSummaryAsync(DateOnly from, DateOnly to, CancellationToken cancellationToken);
}
