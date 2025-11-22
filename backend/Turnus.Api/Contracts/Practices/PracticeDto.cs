using Turnus.Api.Domain;

namespace Turnus.Api.Contracts.Practices;

public record PracticeDto(
    int Id,
    string Name,
    string BillingCode,
    string? Description,
    decimal DefaultPrice,
    bool IsActive,
    IReadOnlyCollection<PracticePriceDto> Prices
)
{
    public static PracticeDto FromEntity(Practice practice) => new(
        practice.Id,
        practice.Name,
        practice.BillingCode,
        practice.Description,
        practice.DefaultPrice,
        practice.IsActive,
        practice.Prices
            .OrderBy(p => p.InsuranceProviderId ?? int.MaxValue)
            .Select(PracticePriceDto.FromEntity)
            .ToList()
    );
}
