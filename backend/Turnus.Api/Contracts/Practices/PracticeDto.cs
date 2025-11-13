using Turnus.Api.Domain;

namespace Turnus.Api.Contracts.Practices;

public record PracticeDto(
    int Id,
    string Name,
    string BillingCode,
    string? Description,
    decimal DefaultPrice,
    bool IsActive
)
{
    public static PracticeDto FromEntity(Practice practice) => new(
        practice.Id,
        practice.Name,
        practice.BillingCode,
        practice.Description,
        practice.DefaultPrice,
        practice.IsActive
    );
}
