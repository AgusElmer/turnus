namespace Turnus.Api.Domain;

public class InsuranceProvider
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? BillingCode { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Patient> Patients { get; } = new List<Patient>();
    public ICollection<Appointment> Appointments { get; } = new List<Appointment>();
    public ICollection<PracticePrice> PracticePrices { get; } = new List<PracticePrice>();
}
