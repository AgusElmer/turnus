namespace Turnus.Api.Domain;

public class Appointment
{
    public int Id { get; set; }
    public DateOnly ServiceDate { get; set; }
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Completed;
    public decimal? CustomPrice { get; set; }
    public decimal BilledAmount { get; set; }
    public string? Notes { get; set; }

    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public int PracticeId { get; set; }
    public Practice Practice { get; set; } = null!;

    public int? InsuranceProviderId { get; set; }
    public InsuranceProvider? InsuranceProvider { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
