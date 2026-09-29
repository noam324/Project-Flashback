using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flashback.Migrations.Migrations
{
    /// <inheritdoc />
    public partial class AddLockerEntitlements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LockerEntitlement",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    AccountId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ItemKey = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    ItemName = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    Category = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    GrantedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LockerEntitlement", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LockerEntitlement_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LockerEntitlement_AccountId_ItemKey",
                table: "LockerEntitlement",
                columns: new[] { "AccountId", "ItemKey" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LockerEntitlement");
        }
    }
}
