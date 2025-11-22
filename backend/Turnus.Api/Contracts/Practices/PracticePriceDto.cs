using Turnus.Api.Domain;

namespace Turnus.Api.Contracts.Practices;

public record PracticePriceDto(
    int Id,
    int PracticeId,
    int? InsuranceProviderId,
    string? InsuranceProviderName,
    decimal Price
)
{
    public static PracticePriceDto FromEntity(PracticePrice price) => new(
        price.Id,
        price.PracticeId,
        price.InsuranceProviderId,
        price.InsuranceProvider?.Name,
        price.Price
    );
}
