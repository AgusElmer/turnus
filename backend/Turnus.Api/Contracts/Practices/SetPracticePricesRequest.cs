using System.ComponentModel.DataAnnotations;

namespace Turnus.Api.Contracts.Practices;

public record SetPracticePricesRequest(
    [param: MinLength(1)] IReadOnlyCollection<PracticePriceInputDto> Prices
);
