using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackendAPI.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddJobPolicies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ExclusiveApplication",
                table: "Jobs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "HireLockMonths",
                table: "Jobs",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "HireLockScope",
                table: "Jobs",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Recruiter");

            migrationBuilder.AddColumn<DateTime>(
                name: "PoliciesAcceptedAt",
                table: "Jobs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RejectWaitDays",
                table: "Jobs",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ResponseDeadlineDays",
                table: "Jobs",
                type: "int",
                nullable: false,
                defaultValue: 14);

            migrationBuilder.AddColumn<DateTime>(
                name: "AcceptedPoliciesAt",
                table: "Applications",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DecidedAt",
                table: "Applications",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExclusiveApplication",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "HireLockMonths",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "HireLockScope",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "PoliciesAcceptedAt",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "RejectWaitDays",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "ResponseDeadlineDays",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "AcceptedPoliciesAt",
                table: "Applications");

            migrationBuilder.DropColumn(
                name: "DecidedAt",
                table: "Applications");
        }
    }
}
