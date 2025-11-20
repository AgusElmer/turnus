using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Turnus.Api.Controllers;

[ApiExplorerSettings(IgnoreApi = true)]
[AllowAnonymous]
public class ErrorController : ControllerBase
{
    [Route("/error")]
    public IActionResult HandleError([FromServices] IWebHostEnvironment environment)
    {
        var exceptionFeature = HttpContext.Features.Get<IExceptionHandlerFeature>();
        var title = environment.IsDevelopment()
            ? exceptionFeature?.Error.Message
            : "Ocurrió un error inesperado.";

        var detail = environment.IsDevelopment() ? exceptionFeature?.Error.StackTrace : null;

        return Problem(title: title, detail: detail, statusCode: StatusCodes.Status500InternalServerError);
    }
}
