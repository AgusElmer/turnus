using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Turnus.Api.Contracts.Insurances;
using Turnus.Api.Services;

namespace Turnus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class InsuranceProvidersController : ControllerBase
{
    private readonly IInsuranceProviderService _insuranceProviderService;
    private readonly IValidator<CreateInsuranceProviderRequest> _createValidator;
    private readonly IValidator<UpdateInsuranceProviderRequest> _updateValidator;

    public InsuranceProvidersController(
        IInsuranceProviderService insuranceProviderService,
        IValidator<CreateInsuranceProviderRequest> createValidator,
        IValidator<UpdateInsuranceProviderRequest> updateValidator)
    {
        _insuranceProviderService = insuranceProviderService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InsuranceProviderDto>>> GetAsync(CancellationToken cancellationToken)
    {
        var providers = await _insuranceProviderService.GetInsuranceProvidersAsync(cancellationToken);
        return Ok(providers.Select(InsuranceProviderDto.FromEntity));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<InsuranceProviderDto>> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var provider = await _insuranceProviderService.GetInsuranceProviderByIdAsync(id, cancellationToken);
        return provider is null ? NotFound() : Ok(InsuranceProviderDto.FromEntity(provider));
    }

    [HttpPost]
    public async Task<ActionResult<InsuranceProviderDto>> CreateAsync(CreateInsuranceProviderRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await _createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors);
        }

        var provider = await _insuranceProviderService.CreateInsuranceProviderAsync(request, cancellationToken);
        return Created($"/api/insuranceproviders/{provider.Id}", InsuranceProviderDto.FromEntity(provider));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<InsuranceProviderDto>> UpdateAsync(int id, UpdateInsuranceProviderRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await _updateValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors);
        }

        var provider = await _insuranceProviderService.UpdateInsuranceProviderAsync(id, request, cancellationToken);
        return provider is null ? NotFound() : Ok(InsuranceProviderDto.FromEntity(provider));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _insuranceProviderService.DeleteInsuranceProviderAsync(id, cancellationToken);
            return result ? NoContent() : NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }
}
