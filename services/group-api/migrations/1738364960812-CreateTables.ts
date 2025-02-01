import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTables1738364960812 implements MigrationInterface {
    name = 'CreateTables1738364960812'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Group" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "createdByUserEmail" character varying(100) NOT NULL, "createdAt" TIMESTAMP NOT NULL, "description" text, CONSTRAINT "PK_d064bd160defed65823032ee547" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."GroupMember_role_enum" AS ENUM('owner', 'admin', 'moderator', 'member')`);
        await queryRunner.query(`CREATE TABLE "GroupMember" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userEmail" character varying(100) NOT NULL, "role" "public"."GroupMember_role_enum" NOT NULL, "joinedAt" TIMESTAMP NOT NULL, "groupId" uuid, CONSTRAINT "PK_fcb0f98fa81fe1915139db94614" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."GroupChannel_type_enum" AS ENUM('text', 'voice')`);
        await queryRunner.query(`CREATE TABLE "GroupChannel" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "type" "public"."GroupChannel_type_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL, "groupId" uuid, CONSTRAINT "PK_48c0d80dea54f5b201e404d1311" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "GroupMember" ADD CONSTRAINT "FK_7fa559140a204b5dcfcc18c9bfb" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "GroupChannel" ADD CONSTRAINT "FK_f0fc74e87a54251747a37384336" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "GroupChannel" DROP CONSTRAINT "FK_f0fc74e87a54251747a37384336"`);
        await queryRunner.query(`ALTER TABLE "GroupMember" DROP CONSTRAINT "FK_7fa559140a204b5dcfcc18c9bfb"`);
        await queryRunner.query(`DROP TABLE "GroupChannel"`);
        await queryRunner.query(`DROP TYPE "public"."GroupChannel_type_enum"`);
        await queryRunner.query(`DROP TABLE "GroupMember"`);
        await queryRunner.query(`DROP TYPE "public"."GroupMember_role_enum"`);
        await queryRunner.query(`DROP TABLE "Group"`);
    }

}
