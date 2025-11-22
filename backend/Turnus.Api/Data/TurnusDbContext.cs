using Microsoft.EntityFrameworkCore;
using Turnus.Api.Domain;

namespace Turnus.Api.Data;

public class TurnusDbContext(DbContextOptions<TurnusDbContext> options) : DbContext(options)
{
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<Practice> Practices => Set<Practice>();
    public DbSet<InsuranceProvider> InsuranceProviders => Set<InsuranceProvider>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<PracticePrice> PracticePrices => Set<PracticePrice>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresEnum<AppointmentStatus>();

        modelBuilder.Entity<Patient>(entity =>
        {
            entity.Property(p => p.FirstName).HasMaxLength(80).IsRequired();
            entity.Property(p => p.LastName).HasMaxLength(80).IsRequired();
            entity.Property(p => p.Dni).HasMaxLength(20).IsRequired();
            entity.Property(p => p.PhoneNumber).HasMaxLength(30);
            entity.Property(p => p.Email).HasMaxLength(120);
            entity.HasIndex(p => p.Dni).IsUnique();
        });

        modelBuilder.Entity<InsuranceProvider>(entity =>
        {
            entity.Property(i => i.Name).HasMaxLength(120).IsRequired();
            entity.Property(i => i.BillingCode).HasMaxLength(30);
            entity.Property(i => i.ContactEmail).HasMaxLength(120);
            entity.Property(i => i.ContactPhone).HasMaxLength(30);
        });

        modelBuilder.Entity<Practice>(entity =>
        {
            entity.Property(p => p.Name).HasMaxLength(120).IsRequired();
            entity.Property(p => p.BillingCode).HasMaxLength(40).IsRequired();
            entity.Property(p => p.DefaultPrice).HasColumnType("numeric(10,2)");
        });

        modelBuilder.Entity<PracticePrice>(entity =>
        {
            entity.Property(p => p.Price).HasColumnType("numeric(10,2)").IsRequired();
            entity.HasIndex(p => new { p.PracticeId, p.InsuranceProviderId }).IsUnique();

            entity.HasOne(p => p.Practice)
                .WithMany(practice => practice.Prices)
                .HasForeignKey(p => p.PracticeId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.InsuranceProvider)
                .WithMany(provider => provider.PracticePrices)
                .HasForeignKey(p => p.InsuranceProviderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.Property(a => a.ServiceDate).HasColumnType("date");
            entity.Property(a => a.CustomPrice).HasColumnType("numeric(10,2)");
            entity.Property(a => a.BilledAmount).HasColumnType("numeric(10,2)");
            entity.HasIndex(a => a.ServiceDate);

            entity.HasOne(a => a.Patient)
                .WithMany(p => p.Appointments)
                .HasForeignKey(a => a.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(a => a.Practice)
                .WithMany(p => p.Appointments)
                .HasForeignKey(a => a.PracticeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(a => a.InsuranceProvider)
                .WithMany(i => i.Appointments)
                .HasForeignKey(a => a.InsuranceProviderId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
