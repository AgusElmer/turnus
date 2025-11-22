using FluentValidation;
using Turnus.Api.Contracts.Appointments;
using Turnus.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Turnus.Api.Validators;

public class UpdateAppointmentRequestValidator : AbstractValidator<UpdateAppointmentRequest>
{
    private readonly TurnusDbContext _dbContext;

    public UpdateAppointmentRequestValidator(TurnusDbContext dbContext)
    {
        _dbContext = dbContext;

        RuleFor(x => x.ServiceDate).NotEmpty();

        RuleFor(x => x.InsuranceProviderId).MustAsync(async (id, cancellation) =>
        {
            if (!id.HasValue) return true;
            return await _dbContext.InsuranceProviders.AnyAsync(i => i.Id == id.Value, cancellation);
        }).WithMessage("Insurance provider not found.");
    }
}
