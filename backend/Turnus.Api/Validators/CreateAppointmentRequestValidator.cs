using FluentValidation;
using Turnus.Api.Contracts.Appointments;
using Turnus.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Turnus.Api.Validators;

public class CreateAppointmentRequestValidator : AbstractValidator<CreateAppointmentRequest>
{
    private readonly TurnusDbContext _dbContext;

    public CreateAppointmentRequestValidator(TurnusDbContext dbContext)
    {
        _dbContext = dbContext;

        RuleFor(x => x.PatientId).NotEmpty();
        RuleFor(x => x.PracticeId).NotEmpty();
        RuleFor(x => x.ServiceDate).NotEmpty();

        RuleFor(x => x.PatientId).MustAsync(async (id, cancellation) =>
        {
            return await _dbContext.Patients.AnyAsync(p => p.Id == id, cancellation);
        }).WithMessage("Patient not found.");

        RuleFor(x => x.PracticeId).MustAsync(async (id, cancellation) =>
        {
            return await _dbContext.Practices.AnyAsync(p => p.Id == id, cancellation);
        }).WithMessage("Practice not found.");

        RuleFor(x => x.InsuranceProviderId).MustAsync(async (id, cancellation) =>
        {
            if (!id.HasValue) return true;
            return await _dbContext.InsuranceProviders.AnyAsync(i => i.Id == id.Value, cancellation);
        }).WithMessage("Insurance provider not found.");
    }
}
