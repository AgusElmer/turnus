using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Turnus.Api.Contracts.Practices;
using Turnus.Api.Services;

namespace Turnus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class PracticesController : ControllerBase
{
    private readonly IPracticeService _practiceService;
    private readonly IValidator<CreatePracticeRequest> _createValidator;
    private readonly IValidator<UpdatePracticeRequest> _updateValidator;
    private readonly IValidator<SetPracticePricesRequest> _setPricesValidator;

    public PracticesController(
        IPracticeService practiceService,
        IValidator<CreatePracticeRequest> createValidator,
        IValidator<UpdatePracticeRequest> updateValidator,
        IValidator<SetPracticePricesRequest> setPricesValidator)
    {
        _practiceService = practiceService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _setPricesValidator = setPricesValidator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PracticeDto>>> GetPracticesAsync(CancellationToken cancellationToken)
    {
        var practices = await _practiceService.GetPracticesAsync(cancellationToken);
        return Ok(practices.Select(PracticeDto.FromEntity));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PracticeDto>> GetPracticeByIdAsync(int id, CancellationToken cancellationToken)
    {
        var practice = await _practiceService.GetPracticeByIdAsync(id, cancellationToken);
        return practice is null ? NotFound() : Ok(PracticeDto.FromEntity(practice));
    }

    [HttpPost]
    public async Task<ActionResult<PracticeDto>> CreatePracticeAsync(CreatePracticeRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await _createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors);
        }

        var practice = await _practiceService.CreatePracticeAsync(request, cancellationToken);
        return Created($"/api/practices/{practice.Id}", PracticeDto.FromEntity(practice));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<PracticeDto>> UpdatePracticeAsync(int id, UpdatePracticeRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await _updateValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors);
        }

        var practice = await _practiceService.UpdatePracticeAsync(id, request, cancellationToken);
        return practice is null ? NotFound() : Ok(PracticeDto.FromEntity(practice));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeletePracticeAsync(int id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _practiceService.DeletePracticeAsync(id, cancellationToken);
            return result ? NoContent() : NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    [HttpGet("{id:int}/prices")]
    public async Task<ActionResult<IEnumerable<PracticePriceDto>>> GetPracticePricesAsync(int id, CancellationToken cancellationToken)
    {
        var prices = await _practiceService.GetPracticePricesAsync(id, cancellationToken);
        return Ok(prices.Select(PracticePriceDto.FromEntity));
    }

    [HttpPut("{id:int}/prices")]
    public async Task<ActionResult<IEnumerable<PracticePriceDto>>> SetPracticePricesAsync(int id, SetPracticePricesRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await _setPricesValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors);
        }

        try
        {
            var prices = await _practiceService.SetPracticePricesAsync(id, request, cancellationToken);
            return Ok(prices.Select(PracticePriceDto.FromEntity));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
