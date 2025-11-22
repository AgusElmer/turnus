using Microsoft.EntityFrameworkCore;
using Turnus.Api.Contracts.Billing;
using Turnus.Api.Data;

namespace Turnus.Api.Services;

public class BillingService : IBillingService
{
    private readonly TurnusDbContext _dbContext;

    public BillingService(TurnusDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<BillingSummaryDto> GetBillingSummaryAsync(DateOnly from, DateOnly to, CancellationToken cancellationToken)
    {
        var completedAppointments = await _dbContext.Appointments
            .Include(a => a.Practice)
            .Include(a => a.InsuranceProvider)
            .Where(a => a.Status == Domain.AppointmentStatus.Completed)
            .Where(a => a.ServiceDate >= from && a.ServiceDate <= to)
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

        return new BillingSummaryDto(from.Year, from.Month, grouped, total);
    }
}
