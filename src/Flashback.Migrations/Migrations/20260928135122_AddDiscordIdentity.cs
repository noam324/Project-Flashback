using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flashback.Migrations.Migrations
{
    /// <inheritdoc />
    public partial class AddDiscordIdentity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DiscordAvatarUrl",
                table: "Accounts",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DiscordUserId",
                table: "Accounts",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DiscordUsername",
                table: "Accounts",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DiscordAvatarUrl",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "DiscordUserId",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "DiscordUsername",
                table: "Accounts");
        }
    }
}
