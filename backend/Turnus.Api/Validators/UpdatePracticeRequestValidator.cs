using FluentValidation;
using Turnus.Api.Contracts.Practices;

namespace Turnus.Api.Validators;

public class UpdatePracticeRequestValidator : AbstractValidator<UpdatePracticeRequest>
{
    public UpdatePracticeRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.BillingCode).NotEmpty().MaximumLength(50);
        RuleFor(x => x.DefaultPrice).GreaterThan(0);
    }
}
