import { MigrationInterface, QueryRunner } from "typeorm";

export class FixGroupMember1738368212405 implements MigrationInterface {
    name = 'FixGroupMember1738368212405'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "GroupMember" DROP CONSTRAINT "FK_7fa559140a204b5dcfcc18c9bfb"`);
        await queryRunner.query(`ALTER TABLE "GroupMember" DROP CONSTRAINT "PK_fcb0f98fa81fe1915139db94614"`);
        await queryRunner.query(`ALTER TABLE "GroupMember" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "GroupMember" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "public"."GroupMember_role_enum"`);
        await queryRunner.query(`ALTER TABLE "GroupMember" DROP COLUMN "joinedAt"`);
        await queryRunner.query(`ALTER TABLE "GroupMember" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "GroupMember" ADD CONSTRAINT "PK_fcb0f98fa81fe1915139db94614" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "GroupMember" ADD "role" "public"."GroupMember_role_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "GroupMember" ADD "joinedAt" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "GroupMember" DROP CONSTRAINT "PK_fcb0f98fa81fe1915139db94614"`);
        await queryRunner.query(`ALTER TABLE "GroupMember" ADD CONSTRAINT "PK_2b83eac0c6ac8f2cfeb40401cac" PRIMARY KEY ("userEmail", "groupId")`);
        await queryRunner.query(`ALTER TABLE "GroupMember" DROP CONSTRAINT "PK_95553c0404d411d7cbed7a0dfda"`);
        await queryRunner.query(`ALTER TABLE "GroupMember" ADD CONSTRAINT "PK_4d80d48b745bc6c08413e77a7e3" PRIMARY KEY ("groupId", "id")`);
        await queryRunner.query(`ALTER TABLE "GroupMember" DROP CONSTRAINT "PK_4d80d48b745bc6c08413e77a7e3"`);
        await queryRunner.query(`ALTER TABLE "GroupMember" ADD CONSTRAINT "PK_fcb0f98fa81fe1915139db94614" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "GroupMember" DROP CONSTRAINT "PK_fcb0f98fa81fe1915139db94614"`);
        await queryRunner.query(`ALTER TABLE "GroupMember" ADD CONSTRAINT "PK_37b67872d0d4fccf9723ff2e2f2" PRIMARY KEY ("id", "userEmail")`);
        await queryRunner.query(`ALTER TABLE "GroupMember" ALTER COLUMN "groupId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "GroupMember" DROP CONSTRAINT "PK_37b67872d0d4fccf9723ff2e2f2"`);
        await queryRunner.query(`ALTER TABLE "GroupMember" ADD CONSTRAINT "PK_95553c0404d411d7cbed7a0dfda" PRIMARY KEY ("userEmail", "id", "groupId")`);
        await queryRunner.query(`CREATE INDEX "IDX_a9668319fe6e13d6f3e2ed3069" ON "GroupMember" ("userEmail") `);
        await queryRunner.query(`CREATE INDEX "IDX_7fa559140a204b5dcfcc18c9bf" ON "GroupMember" ("groupId") `);
        await queryRunner.query(`ALTER TABLE "GroupMember" ADD CONSTRAINT "FK_7fa559140a204b5dcfcc18c9bfb" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "GroupMember" ADD CONSTRAINT "FK_a9668319fe6e13d6f3e2ed30699" FOREIGN KEY ("userEmail") REFERENCES "user"("email") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "GroupMember" DROP CONSTRAINT "FK_a9668319fe6e13d6f3e2ed30699"`);
        await queryRunner.query(`ALTER TABLE "GroupMember" DROP CONSTRAINT "FK_7fa559140a204b5dcfcc18c9bfb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7fa559140a204b5dcfcc18c9bf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a9668319fe6e13d6f3e2ed3069"`);
        await queryRunner.query(`ALTER TABLE "GroupMember" DROP CONSTRAINT "PK_95553c0404d411d7cbed7a0dfda"`);
        await queryRunner.query(`ALTER TABLE "GroupMember" ADD CONSTRAINT "PK_37b67872d0d4fccf9723ff2e2f2" PRIMARY KEY ("userEmail", "id")`);
        await queryRunner.query(`ALTER TABLE "GroupMember" ALTER COLUMN "groupId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "GroupMember" DROP CONSTRAINT "PK_37b67872d0d4fccf9723ff2e2f2"`);
        await queryRunner.query(`ALTER TABLE "GroupMember" ADD CONSTRAINT "PK_fcb0f98fa81fe1915139db94614" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "GroupMember" DROP CONSTRAINT "PK_fcb0f98fa81fe1915139db94614"`);
        await queryRunner.query(`ALTER TABLE "GroupMember" ADD CONSTRAINT "PK_4d80d48b745bc6c08413e77a7e3" PRIMARY KEY ("groupId", "id")`);
        await queryRunner.query(`ALTER TABLE "GroupMember" DROP CONSTRAINT "PK_4d80d48b745bc6c08413e77a7e3"`);
        await queryRunner.query(`ALTER TABLE "GroupMember" ADD CONSTRAINT "PK_95553c0404d411d7cbed7a0dfda" PRIMARY KEY ("userEmail", "groupId", "id")`);
        await queryRunner.query(`ALTER TABLE "GroupMember" DROP CONSTRAINT "PK_2b83eac0c6ac8f2cfeb40401cac"`);
        await queryRunner.query(`ALTER TABLE "GroupMember" ADD CONSTRAINT "PK_fcb0f98fa81fe1915139db94614" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "GroupMember" DROP COLUMN "joinedAt"`);
        await queryRunner.query(`ALTER TABLE "GroupMember" DROP COLUMN "role"`);
        await queryRunner.query(`ALTER TABLE "GroupMember" DROP CONSTRAINT "PK_fcb0f98fa81fe1915139db94614"`);
        await queryRunner.query(`ALTER TABLE "GroupMember" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "GroupMember" ADD "joinedAt" TIMESTAMP NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."GroupMember_role_enum" AS ENUM('owner', 'admin', 'moderator', 'member')`);
        await queryRunner.query(`ALTER TABLE "GroupMember" ADD "role" "public"."GroupMember_role_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "GroupMember" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "GroupMember" ADD CONSTRAINT "PK_fcb0f98fa81fe1915139db94614" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "GroupMember" ADD CONSTRAINT "FK_7fa559140a204b5dcfcc18c9bfb" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
