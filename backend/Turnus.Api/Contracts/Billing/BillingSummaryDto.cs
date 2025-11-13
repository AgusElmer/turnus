namespace Turnus.Api.Contracts.Billing;

public record BillingSummaryDto(
    int Year,
    int Month,
    IReadOnlyCollection<BillingProviderSummaryDto> Providers,
    decimal TotalAmount
);

public record BillingProviderSummaryDto(
    int InsuranceProviderId,
    string InsuranceProviderName,
    decimal TotalAmount,
    IReadOnlyCollection<BillingPracticeBreakdownDto> Practices
);

public record BillingPracticeBreakdownDto(
    int PracticeId,
    string PracticeName,
    int Quantity,
    decimal Amount
);
