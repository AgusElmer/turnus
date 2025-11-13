using Microsoft.EntityFrameworkCore;
using Turnus.Api.Data;
using Turnus.Api.Domain;

namespace Turnus.Api.Seed;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(TurnusDbContext dbContext, CancellationToken cancellationToken)
    {
        if (await dbContext.InsuranceProviders.AnyAsync(cancellationToken))
        {
            return;
        }

        var swiss = new InsuranceProvider
        {
            Name = "Swiss Medical",
            BillingCode = "SWISS",
            ContactEmail = "auditoria@swissmedical.com.ar"
        };

        var osde = new InsuranceProvider
        {
            Name = "OSDE",
            BillingCode = "OSDE",
            ContactEmail = "prestadores@osde.com.ar"
        };

        var galeno = new InsuranceProvider
        {
            Name = "Galeno",
            BillingCode = "GAL",
            ContactEmail = "prestadores@galeno.com.ar"
        };

        dbContext.InsuranceProviders.AddRange(swiss, osde, galeno);

        var echo = new Practice
        {
            Name = "Ecografia",
            BillingCode = "ECO",
            DefaultPrice = 8000m,
            Description = "Ecografía general"
        };

        var consult = new Practice
        {
            Name = "Consulta",
            BillingCode = "CONS",
            DefaultPrice = 5000m,
            Description = "Consulta médica"
        };

        dbContext.Practices.AddRange(echo, consult);

        var patient = new Patient
        {
            FirstName = "Maria",
            LastName = "Gonzalez",
            Dni = "30111222",
            InsuranceProvider = swiss,
            PhoneNumber = "+54 11 5555-6666"
        };

        dbContext.Patients.Add(patient);

        dbContext.Appointments.Add(new Appointment
        {
            Patient = patient,
            Practice = echo,
            InsuranceProvider = swiss,
            ServiceDate = DateOnly.FromDateTime(DateTime.Today),
            Status = AppointmentStatus.Completed,
            CustomPrice = null,
            BilledAmount = echo.DefaultPrice,
            Notes = "Control de embarazo"
        });

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
