// migration file snippet: SetCreatedAtForMessagesMigration.ts
import { DataSource, MigrationInterface, QueryRunner } from 'typeorm';

export class SetCreatedAtForMessagesMigration1660000000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Update rows that currently have null for createdAt.
        await queryRunner.query(`
            UPDATE "Message"
            SET "createdAt" = CURRENT_TIMESTAMP
            WHERE "createdAt" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Optional: if you need to reverse this migration,
        // you can set the timestamp back to null. Be cautious!
        await queryRunner.query(`
            UPDATE "Message"
            SET "createdAt" = NULL
            WHERE "createdAt" = CURRENT_TIMESTAMP
        `);
    }
}
