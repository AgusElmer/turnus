using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Turnus.Api.Contracts.Appointments;
using Turnus.Api.Services;

namespace Turnus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;
    private readonly IValidator<CreateAppointmentRequest> _createValidator;
    private readonly IValidator<UpdateAppointmentRequest> _updateValidator;

    public AppointmentsController(
        IAppointmentService appointmentService,
        IValidator<CreateAppointmentRequest> createValidator,
        IValidator<UpdateAppointmentRequest> updateValidator)
    {
        _appointmentService = appointmentService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AppointmentDto>>> GetAsync(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] int? insuranceProviderId,
        CancellationToken cancellationToken)
    {
        var appointments = await _appointmentService.GetAppointmentsAsync(from, to, insuranceProviderId, cancellationToken);
        return Ok(appointments.Select(AppointmentDto.FromEntity));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AppointmentDto>> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var appointment = await _appointmentService.GetAppointmentByIdAsync(id, cancellationToken);
        return appointment is null ? NotFound() : Ok(AppointmentDto.FromEntity(appointment));
    }

    [HttpPost]
    public async Task<ActionResult<AppointmentDto>> CreateAsync(CreateAppointmentRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await _createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors);
        }

        var appointment = await _appointmentService.CreateAppointmentAsync(request, cancellationToken);
        return Created($"/api/appointments/{appointment.Id}", AppointmentDto.FromEntity(appointment));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<AppointmentDto>> UpdateAsync(int id, UpdateAppointmentRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await _updateValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors);
        }

        var appointment = await _appointmentService.UpdateAppointmentAsync(id, request, cancellationToken);
        return appointment is null ? NotFound() : Ok(AppointmentDto.FromEntity(appointment));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var result = await _appointmentService.DeleteAppointmentAsync(id, cancellationToken);
        return result ? NoContent() : NotFound();
    }
}
