using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackendAPI.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddVenueToInterview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Venue",
                table: "Interviews",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Venue",
                table: "Interviews");
        }
    }
}
