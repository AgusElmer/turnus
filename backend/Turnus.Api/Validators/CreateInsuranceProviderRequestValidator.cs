using FluentValidation;
using Turnus.Api.Contracts.Insurances;

namespace Turnus.Api.Validators;

public class CreateInsuranceProviderRequestValidator : AbstractValidator<CreateInsuranceProviderRequest>
{
    public CreateInsuranceProviderRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("El nombre es requerido.").MaximumLength(100);
        RuleFor(x => x.ContactEmail).EmailAddress().WithMessage("El email de contacto no es válido.").When(x => !string.IsNullOrEmpty(x.ContactEmail));
    }
}
