import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropDefaultCreatedAtValue1744132828904
    implements MigrationInterface
{
    name = 'DropDefaultCreatedAtValue1744132828904';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ensure no rows have null values before altering the column
        await queryRunner.query(
            `UPDATE "Message" SET "createdAt" = now() WHERE "createdAt" IS NULL`
        );

        await queryRunner.query(
            `ALTER TABLE "Message" ALTER COLUMN "createdAt" DROP DEFAULT`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "Message" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`
        );
    }
}
