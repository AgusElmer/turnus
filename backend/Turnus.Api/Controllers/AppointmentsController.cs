using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Turnus.Api.Contracts.Appointments;
using Turnus.Api.Data;
using Turnus.Api.Domain;

namespace Turnus.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppointmentsController(TurnusDbContext dbContext) : ControllerBase
{
    private readonly TurnusDbContext _dbContext = dbContext;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AppointmentDto>>> GetAsync(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] int? insuranceProviderId,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Practice)
            .Include(a => a.InsuranceProvider)
            .AsNoTracking()
            .AsQueryable();

        if (from.HasValue)
        {
            query = query.Where(a => a.ServiceDate >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(a => a.ServiceDate <= to.Value);
        }

        if (insuranceProviderId.HasValue)
        {
            query = query.Where(a => a.InsuranceProviderId == insuranceProviderId.Value);
        }

        var appointments = await query
            .OrderBy(a => a.ServiceDate)
            .ThenBy(a => a.Patient.LastName)
            .ToListAsync(cancellationToken);

        return Ok(appointments.Select(AppointmentDto.FromEntity));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AppointmentDto>> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var appointment = await _dbContext.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Practice)
            .Include(a => a.InsuranceProvider)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        return appointment is null ? NotFound() : Ok(AppointmentDto.FromEntity(appointment));
    }

    [HttpPost]
    public async Task<ActionResult<AppointmentDto>> CreateAsync(CreateAppointmentRequest request, CancellationToken cancellationToken)
    {
        var patient = await _dbContext.Patients.FirstOrDefaultAsync(p => p.Id == request.PatientId, cancellationToken);
        if (patient is null)
        {
            return BadRequest("Patient not found.");
        }

        var practice = await _dbContext.Practices.FirstOrDefaultAsync(p => p.Id == request.PracticeId, cancellationToken);
        if (practice is null)
        {
            return BadRequest("Practice not found.");
        }

        if (request.InsuranceProviderId.HasValue)
        {
            var insuranceExists = await _dbContext.InsuranceProviders
                .AnyAsync(i => i.Id == request.InsuranceProviderId.Value, cancellationToken);
            if (!insuranceExists)
            {
                return BadRequest("Insurance provider not found.");
            }
        }

        var billedAmount = request.CustomPrice ?? practice.DefaultPrice;

        var appointment = new Appointment
        {
            PatientId = request.PatientId,
            PracticeId = request.PracticeId,
            InsuranceProviderId = request.InsuranceProviderId ?? patient.InsuranceProviderId,
            ServiceDate = request.ServiceDate,
            Status = request.Status,
            CustomPrice = request.CustomPrice,
            BilledAmount = billedAmount,
            Notes = request.Notes
        };

        _dbContext.Appointments.Add(appointment);
        await _dbContext.SaveChangesAsync(cancellationToken);

        await _dbContext.Entry(appointment).Reference(a => a.Patient).LoadAsync(cancellationToken);
        await _dbContext.Entry(appointment).Reference(a => a.Practice).LoadAsync(cancellationToken);
        await _dbContext.Entry(appointment).Reference(a => a.InsuranceProvider).LoadAsync(cancellationToken);

        return Created($"/api/appointments/{appointment.Id}", AppointmentDto.FromEntity(appointment));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<AppointmentDto>> UpdateAsync(int id, UpdateAppointmentRequest request, CancellationToken cancellationToken)
    {
        var appointment = await _dbContext.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Practice)
            .Include(a => a.InsuranceProvider)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (appointment is null)
        {
            return NotFound();
        }

        if (request.InsuranceProviderId.HasValue)
        {
            var insuranceExists = await _dbContext.InsuranceProviders
                .AnyAsync(i => i.Id == request.InsuranceProviderId.Value, cancellationToken);
            if (!insuranceExists)
            {
                return BadRequest("Insurance provider not found.");
            }
        }

        appointment.ServiceDate = request.ServiceDate;
        appointment.Status = request.Status;
        appointment.Notes = request.Notes;
        appointment.InsuranceProviderId = request.InsuranceProviderId;

        if (request.CustomPrice.HasValue)
        {
            appointment.CustomPrice = request.CustomPrice;
            appointment.BilledAmount = request.CustomPrice.Value;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(AppointmentDto.FromEntity(appointment));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var appointment = await _dbContext.Appointments.FindAsync([id], cancellationToken);
        if (appointment is null)
        {
            return NotFound();
        }

        _dbContext.Appointments.Remove(appointment);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
