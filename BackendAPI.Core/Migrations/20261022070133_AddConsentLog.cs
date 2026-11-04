using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackendAPI.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddConsentLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ConsentLog",
                columns: table => new
                {
                    ConsentLogId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: true),
                    VisitorId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    ConsentType = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Version = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    AcceptedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConsentLog", x => x.ConsentLogId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ConsentLog_AcceptedAt",
                table: "ConsentLog",
                column: "AcceptedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ConsentLog_VisitorId_ConsentType_Version",
                table: "ConsentLog",
                columns: new[] { "VisitorId", "ConsentType", "Version" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConsentLog");
        }
    }
}
