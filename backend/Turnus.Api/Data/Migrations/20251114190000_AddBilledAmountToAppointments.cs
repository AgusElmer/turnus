using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Turnus.Api.Data;

#nullable disable

namespace Turnus.Api.Data.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(TurnusDbContext))]
    [Migration("20251114190000_AddBilledAmountToAppointments")]
    public partial class AddBilledAmountToAppointments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "BilledAmount",
                table: "Appointments",
                type: "numeric(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.Sql("""
                UPDATE "Appointments" AS a
                SET "BilledAmount" = COALESCE(a."CustomPrice", p."DefaultPrice")
                FROM "Practices" AS p
                WHERE p."Id" = a."PracticeId";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BilledAmount",
                table: "Appointments");
        }
    }
}
