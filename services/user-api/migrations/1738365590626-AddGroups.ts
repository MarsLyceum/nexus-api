import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGroups1738365590626 implements MigrationInterface {
    name = 'AddGroups1738365590626'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "group_member" ("userEmail" character varying(100) NOT NULL, "groupId" uuid NOT NULL, CONSTRAINT "PK_a3cc4358d1de1af77b1f849fbc6" PRIMARY KEY ("userEmail", "groupId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bda67d885a087fdf1d72f46de9" ON "group_member" ("userEmail") `);
        await queryRunner.query(`CREATE INDEX "IDX_44c8964c097cf7f71434d6d112" ON "group_member" ("groupId") `);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "PK_cace4a159ff9f2512dd42373760"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "group_member" ADD CONSTRAINT "FK_bda67d885a087fdf1d72f46de98" FOREIGN KEY ("userEmail") REFERENCES "user"("email") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "group_member" ADD CONSTRAINT "FK_44c8964c097cf7f71434d6d1122" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "group_member" DROP CONSTRAINT "FK_44c8964c097cf7f71434d6d1122"`);
        await queryRunner.query(`ALTER TABLE "group_member" DROP CONSTRAINT "FK_bda67d885a087fdf1d72f46de98"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "PK_cace4a159ff9f2512dd42373760"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")`);
        await queryRunner.query(`DROP INDEX "public"."IDX_44c8964c097cf7f71434d6d112"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bda67d885a087fdf1d72f46de9"`);
        await queryRunner.query(`DROP TABLE "group_member"`);
    }

}
