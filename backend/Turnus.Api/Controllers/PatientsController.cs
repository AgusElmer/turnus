using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Turnus.Api.Contracts.Patients;
using Turnus.Api.Data;
using Turnus.Api.Domain;

namespace Turnus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class PatientsController(TurnusDbContext dbContext) : ControllerBase
{
    private readonly TurnusDbContext _dbContext = dbContext;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PatientDto>>> GetPatientsAsync(CancellationToken cancellationToken)
    {
        var patients = await _dbContext.Patients
            .Include(p => p.InsuranceProvider)
            .AsNoTracking()
            .OrderBy(p => p.LastName)
            .ThenBy(p => p.FirstName)
            .ToListAsync(cancellationToken);

        return Ok(patients.Select(PatientDto.FromEntity));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PatientDto>> GetPatientByIdAsync(int id, CancellationToken cancellationToken)
    {
        var patient = await _dbContext.Patients
            .Include(p => p.InsuranceProvider)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        return patient is null ? NotFound() : Ok(PatientDto.FromEntity(patient));
    }

    [HttpPost]
    public async Task<ActionResult<PatientDto>> CreatePatientAsync(CreatePatientRequest request, CancellationToken cancellationToken)
    {
        if (!await IsInsuranceValidAsync(request.InsuranceProviderId, cancellationToken))
        {
            return BadRequest("Invalid insurance provider.");
        }

        var dniExists = await _dbContext.Patients.AnyAsync(p => p.Dni == request.Dni, cancellationToken);
        if (dniExists)
        {
            return Conflict($"Patient with DNI {request.Dni} already exists.");
        }

        var patient = new Patient
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Dni = request.Dni.Trim(),
            PhoneNumber = request.PhoneNumber?.Trim(),
            Email = request.Email?.Trim(),
            InsuranceProviderId = request.InsuranceProviderId
        };

        _dbContext.Patients.Add(patient);
        await _dbContext.SaveChangesAsync(cancellationToken);

        await _dbContext.Entry(patient).Reference(p => p.InsuranceProvider).LoadAsync(cancellationToken);

        return Created($"/api/patients/{patient.Id}", PatientDto.FromEntity(patient));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<PatientDto>> UpdatePatientAsync(int id, UpdatePatientRequest request, CancellationToken cancellationToken)
    {
        var patient = await _dbContext.Patients.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (patient is null)
        {
            return NotFound();
        }

        if (!await IsInsuranceValidAsync(request.InsuranceProviderId, cancellationToken))
        {
            return BadRequest("Invalid insurance provider.");
        }

        var dniExists = await _dbContext.Patients
            .AnyAsync(p => p.Id != id && p.Dni == request.Dni, cancellationToken);
        if (dniExists)
        {
            return Conflict($"Another patient already uses DNI {request.Dni}.");
        }

        patient.FirstName = request.FirstName.Trim();
        patient.LastName = request.LastName.Trim();
        patient.Dni = request.Dni.Trim();
        patient.PhoneNumber = request.PhoneNumber?.Trim();
        patient.Email = request.Email?.Trim();
        patient.InsuranceProviderId = request.InsuranceProviderId;
        patient.IsActive = request.IsActive;
        patient.UpdatedAtUtc = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        await _dbContext.Entry(patient).Reference(p => p.InsuranceProvider).LoadAsync(cancellationToken);

        return Ok(PatientDto.FromEntity(patient));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeletePatientAsync(int id, CancellationToken cancellationToken)
    {
        var patient = await _dbContext.Patients.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (patient is null)
        {
            return NotFound();
        }

        var hasAppointments = await _dbContext.Appointments.AnyAsync(a => a.PatientId == id, cancellationToken);
        if (hasAppointments)
        {
            return Conflict("The patient has appointments assigned. Disable it instead of deleting.");
        }

        _dbContext.Patients.Remove(patient);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<bool> IsInsuranceValidAsync(int? insuranceId, CancellationToken cancellationToken)
    {
        if (insuranceId is null)
        {
            return true;
        }

        return await _dbContext.InsuranceProviders
            .AnyAsync(i => i.Id == insuranceId && i.IsActive, cancellationToken);
    }
}
