namespace Turnus.Api.Domain;

public class PracticePrice
{
    public int Id { get; set; }
    public int PracticeId { get; set; }
    public Practice Practice { get; set; } = null!;
    public int? InsuranceProviderId { get; set; }
    public InsuranceProvider? InsuranceProvider { get; set; }
    public decimal Price { get; set; }
}
