using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Turnus.Api.Data;

#nullable disable

namespace Turnus.Api.Data.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(TurnusDbContext))]
    [Migration("20251122120000_AddAppointmentTiming")]
    public partial class AddAppointmentTiming : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DurationMinutes",
                table: "Appointments",
                type: "integer",
                nullable: false,
                defaultValue: 15);

            migrationBuilder.AddColumn<TimeOnly>(
                name: "ServiceTime",
                table: "Appointments",
                type: "time",
                nullable: false,
                defaultValue: new TimeOnly(0, 0));

            migrationBuilder.DropIndex(
                name: "IX_Appointments_ServiceDate",
                table: "Appointments");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_ServiceDate_ServiceTime",
                table: "Appointments",
                columns: new[] { "ServiceDate", "ServiceTime" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Appointments_ServiceDate_ServiceTime",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "DurationMinutes",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "ServiceTime",
                table: "Appointments");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_ServiceDate",
                table: "Appointments",
                column: "ServiceDate");
        }
    }
}
