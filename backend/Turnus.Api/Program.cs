using System.Security.Claims;
using System.Text.Json.Serialization;
using FluentValidation;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Turnus.Api.Data;
using Turnus.Api.Seed;
using Turnus.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// For local development, use .NET User Secrets to store your connection string.
// See: https://go.microsoft.com/fwlink/?linkid=2131348
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? builder.Configuration["DATABASE_URL"];

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("Database connection string is not configured. Please set 'ConnectionStrings:Default' or 'DATABASE_URL'.");
}

builder.Services.AddDbContext<TurnusDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<IPatientService, PatientService>();
builder.Services.AddScoped<IPracticeService, PracticeService>();
builder.Services.AddScoped<IInsuranceProviderService, InsuranceProviderService>();
builder.Services.AddScoped<IBillingService, BillingService>();

builder.Services.AddDatabaseDeveloperPageExceptionFilter();

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);

var configuredOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
var corsOrigins = configuredOrigins.Length > 0
    ? configuredOrigins
    : new[] { "http://localhost:5173", "http://127.0.0.1:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy.WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
var allowedEmailSet = (builder.Configuration.GetSection("Authentication:Google:AllowedEmails").Get<string[]>()
        ?? Array.Empty<string>())
    .Where(value => !string.IsNullOrWhiteSpace(value))
    .Select(value => value.Trim())
    .ToHashSet(StringComparer.OrdinalIgnoreCase);

if (string.IsNullOrWhiteSpace(googleClientId))
{
    throw new InvalidOperationException("Google authentication is not configured. Please set 'Authentication:Google:ClientId' in your configuration.");
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://accounts.google.com";
        options.RequireHttpsMetadata = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuers = new[] { "https://accounts.google.com", "accounts.google.com" },
            ValidateAudience = true,
            ValidAudience = googleClientId,
            ValidateLifetime = true
        };
    });


builder.Services.AddAuthorization(options =>
{
    var policyBuilder = new AuthorizationPolicyBuilder(JwtBearerDefaults.AuthenticationScheme);

    policyBuilder.RequireAuthenticatedUser();

    if (allowedEmailSet.Count > 0)
    {
        policyBuilder.RequireAssertion(context =>
        {
            var email = context.User.FindFirst(ClaimTypes.Email)?.Value
                        ?? context.User.FindFirst("email")?.Value;
            return email is not null && allowedEmailSet.Contains(email);
        });
    }

    var policy = policyBuilder.Build();
    options.DefaultPolicy = policy;
    options.FallbackPolicy = policy;
});

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

var shouldSeedDemoData = app.Configuration.GetValue("Database:SeedDemoData", app.Environment.IsDevelopment());

app.UseExceptionHandler("/error");
app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<TurnusDbContext>();
    await dbContext.Database.MigrateAsync();
    if (shouldSeedDemoData)
    {
        await DatabaseSeeder.SeedAsync(dbContext, CancellationToken.None);
    }
}

app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
