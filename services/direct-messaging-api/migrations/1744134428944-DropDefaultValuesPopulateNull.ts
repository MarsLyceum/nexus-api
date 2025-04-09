import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropDefaultValuesPopulateNull1744134428944
    implements MigrationInterface
{
    name = 'DropDefaultValuesPopulateNull1744134428944';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `UPDATE "Message" SET "createdAt" = now() WHERE "createdAt" IS NULL`
        );

        await queryRunner.query(
            `ALTER TABLE "Message" ALTER COLUMN "createdAt" DROP DEFAULT`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "Message" ADD "createdAt" TIMESTAMP NOT NULL`
        );
    }
}
