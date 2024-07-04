import { MigrationInterface, QueryRunner } from "typeorm";

export class Updates1720101859863 implements MigrationInterface {
    name = 'Updates1720101859863'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_entity" ("id" SERIAL NOT NULL, "email" character varying(100) NOT NULL, "firstName" character varying(50) NOT NULL, "lastName" character varying(50) NOT NULL, "phoneNumber" character varying(20) NOT NULL, CONSTRAINT "PK_b54f8ea623b17094db7667d8206" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user_entity"`);
    }

}
