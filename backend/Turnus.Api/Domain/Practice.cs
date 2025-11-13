namespace Turnus.Api.Domain;

public class Practice
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string BillingCode { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal DefaultPrice { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Appointment> Appointments { get; } = new List<Appointment>();
}
