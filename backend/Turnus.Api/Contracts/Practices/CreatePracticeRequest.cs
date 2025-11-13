using System.ComponentModel.DataAnnotations;

namespace Turnus.Api.Contracts.Practices;

public record CreatePracticeRequest(
    [param: Required, MaxLength(120)] string Name,
    [param: Required, MaxLength(40)] string BillingCode,
    [param: MaxLength(250)] string? Description,
    [param: Range(0, 1000000)] decimal DefaultPrice
);
