import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPhoneNumberToUser1718733228744 implements MigrationInterface {
    name = 'AddPhoneNumberToUser1718733228744'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "hashedPassword"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "age"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "phoneNumber" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "firstName" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "lastName" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "lastName" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "firstName" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "phoneNumber"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "age" integer`);
        await queryRunner.query(`ALTER TABLE "user" ADD "hashedPassword" character varying NOT NULL`);
    }

}
