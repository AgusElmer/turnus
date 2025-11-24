using FluentValidation;
using Turnus.Api.Contracts.Appointments;
using Turnus.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Turnus.Api.Options;

namespace Turnus.Api.Validators;

public class UpdateAppointmentRequestValidator : AbstractValidator<UpdateAppointmentRequest>
{
    private readonly TurnusDbContext _dbContext;
    private readonly AppointmentOptions _appointmentOptions;

    public UpdateAppointmentRequestValidator(TurnusDbContext dbContext, IOptions<AppointmentOptions> appointmentOptions)
    {
        _dbContext = dbContext;
        _appointmentOptions = appointmentOptions.Value;

        RuleFor(x => x.ServiceDate).NotEmpty();
        RuleFor(x => x.ServiceTime)
            .NotEmpty()
            .Must(IsAlignedToSlot)
            .WithMessage($"Service time must align to {_appointmentOptions.DefaultDurationMinutes}-minute slots.");
        RuleFor(x => x.DurationMinutes)
            .InclusiveBetween(5, 480)
            .When(x => x.DurationMinutes.HasValue);

        RuleFor(x => x.InsuranceProviderId).MustAsync(async (id, cancellation) =>
        {
            if (!id.HasValue) return true;
            return await _dbContext.InsuranceProviders.AnyAsync(i => i.Id == id.Value, cancellation);
        }).WithMessage("Insurance provider not found.");
    }

    private bool IsAlignedToSlot(TimeOnly serviceTime)
    {
        var slot = _appointmentOptions.DefaultDurationMinutes;
        return slot > 0 && serviceTime.Second == 0 && serviceTime.Nanosecond == 0 && serviceTime.Minute % slot == 0;
    }
}
