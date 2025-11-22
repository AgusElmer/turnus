using FluentValidation;
using Turnus.Api.Contracts.Practices;

namespace Turnus.Api.Validators;

public class SetPracticePricesRequestValidator : AbstractValidator<SetPracticePricesRequest>
{
    public SetPracticePricesRequestValidator()
    {
        RuleFor(x => x.Prices).NotEmpty();
        RuleForEach(x => x.Prices).ChildRules(price =>
        {
            price.RuleFor(p => p.Price).GreaterThan(0);
        });
    }
}
