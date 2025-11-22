using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Turnus.Api.Contracts.Patients;
using Turnus.Api.Services;

namespace Turnus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class PatientsController : ControllerBase
{
    private readonly IPatientService _patientService;
    private readonly IValidator<CreatePatientRequest> _createValidator;
    private readonly IValidator<UpdatePatientRequest> _updateValidator;

    public PatientsController(
        IPatientService patientService,
        IValidator<CreatePatientRequest> createValidator,
        IValidator<UpdatePatientRequest> updateValidator)
    {
        _patientService = patientService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PatientDto>>> GetPatientsAsync(CancellationToken cancellationToken)
    {
        var patients = await _patientService.GetPatientsAsync(cancellationToken);
        return Ok(patients.Select(PatientDto.FromEntity));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PatientDto>> GetPatientByIdAsync(int id, CancellationToken cancellationToken)
    {
        var patient = await _patientService.GetPatientByIdAsync(id, cancellationToken);
        return patient is null ? NotFound() : Ok(PatientDto.FromEntity(patient));
    }

    [HttpPost]
    public async Task<ActionResult<PatientDto>> CreatePatientAsync(CreatePatientRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await _createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors);
        }

        var patient = await _patientService.CreatePatientAsync(request, cancellationToken);
        return Created($"/api/patients/{patient.Id}", PatientDto.FromEntity(patient));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<PatientDto>> UpdatePatientAsync(int id, UpdatePatientRequest request, CancellationToken cancellationToken)
    {
        var context = new ValidationContext<UpdatePatientRequest>(request);
        context.RootContextData["id"] = id;
        var validationResult = await _updateValidator.ValidateAsync(context, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors);
        }

        var patient = await _patientService.UpdatePatientAsync(id, request, cancellationToken);
        return patient is null ? NotFound() : Ok(PatientDto.FromEntity(patient));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeletePatientAsync(int id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _patientService.DeletePatientAsync(id, cancellationToken);
            return result ? NoContent() : NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }
}
