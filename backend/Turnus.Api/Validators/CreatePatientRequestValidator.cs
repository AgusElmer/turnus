using FluentValidation;
using Turnus.Api.Contracts.Patients;
using Turnus.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Turnus.Api.Validators;

public class CreatePatientRequestValidator : AbstractValidator<CreatePatientRequest>
{
    private readonly TurnusDbContext _dbContext;

    public CreatePatientRequestValidator(TurnusDbContext dbContext)
    {
        _dbContext = dbContext;

        RuleFor(x => x.FirstName).NotEmpty().WithMessage("El nombre es requerido.").MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().WithMessage("El apellido es requerido.").MaximumLength(100);
        RuleFor(x => x.Dni).NotEmpty().WithMessage("El DNI es requerido.").MaximumLength(20);
        RuleFor(x => x.Email).EmailAddress().WithMessage("El email no es válido.").When(x => !string.IsNullOrEmpty(x.Email));

        RuleFor(x => x.Dni).MustAsync(async (dni, cancellation) =>
        {
            return !await _dbContext.Patients.AnyAsync(p => p.Dni == dni, cancellation);
        }).WithMessage("Ya existe un paciente con este DNI.");

        RuleFor(x => x.InsuranceProviderId).MustAsync(async (id, cancellation) =>
        {
            if (!id.HasValue) return true;
            return await _dbContext.InsuranceProviders.AnyAsync(i => i.Id == id.Value && i.IsActive, cancellation);
        }).WithMessage("La obra social no es válida.");
    }
}
