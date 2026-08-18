using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ScanPlantAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddPlantSafetyAssessment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EdibilityNote",
                table: "Plants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EdibilityStatus",
                table: "Plants",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EdiblePartsJson",
                table: "Plants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LegalNote",
                table: "Plants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LegalStatus",
                table: "Plants",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "SafetyAssessedAt",
                table: "Plants",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SafetyAssessmentOrigin",
                table: "Plants",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SafetyDisclaimer",
                table: "Plants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SafetySourcesJson",
                table: "Plants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ToxicityNote",
                table: "Plants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ToxicityStatus",
                table: "Plants",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EdibilityNote",
                table: "Plants");

            migrationBuilder.DropColumn(
                name: "EdibilityStatus",
                table: "Plants");

            migrationBuilder.DropColumn(
                name: "EdiblePartsJson",
                table: "Plants");

            migrationBuilder.DropColumn(
                name: "LegalNote",
                table: "Plants");

            migrationBuilder.DropColumn(
                name: "LegalStatus",
                table: "Plants");

            migrationBuilder.DropColumn(
                name: "SafetyAssessedAt",
                table: "Plants");

            migrationBuilder.DropColumn(
                name: "SafetyAssessmentOrigin",
                table: "Plants");

            migrationBuilder.DropColumn(
                name: "SafetyDisclaimer",
                table: "Plants");

            migrationBuilder.DropColumn(
                name: "SafetySourcesJson",
                table: "Plants");

            migrationBuilder.DropColumn(
                name: "ToxicityNote",
                table: "Plants");

            migrationBuilder.DropColumn(
                name: "ToxicityStatus",
                table: "Plants");
        }
    }
}
