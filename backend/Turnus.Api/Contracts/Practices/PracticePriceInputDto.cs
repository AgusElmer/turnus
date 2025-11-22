using System.ComponentModel.DataAnnotations;

namespace Turnus.Api.Contracts.Practices;

public record PracticePriceInputDto(
    int? InsuranceProviderId,
    [param: Range(0, 1000000)] decimal Price
);
