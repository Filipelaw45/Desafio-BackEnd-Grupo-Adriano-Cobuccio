import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1761859432327 implements MigrationInterface {
    name = 'InitialMigration1761859432327'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "refresh_token" character varying, "deletedAt" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TABLE "wallets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "balance" numeric(10,2) NOT NULL DEFAULT '0', "user_id" uuid NOT NULL, CONSTRAINT "REL_92558c08091598f7a4439586cd" UNIQUE ("user_id"), CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."ledger_entries_type_enum" AS ENUM('DEBIT', 'CREDIT')`);
        await queryRunner.query(`CREATE TABLE "ledger_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "transaction_id" uuid NOT NULL, "amount" numeric(10,2) NOT NULL, "type" "public"."ledger_entries_type_enum" NOT NULL, "balance_after" numeric(10,2) NOT NULL, "description" text, CONSTRAINT "PK_6efcb84411d3f08b08450ae75d5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b26c5ef5853fd6e0a8680427f6" ON "ledger_entries" ("transaction_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_1328c522a37c1d883b967d759f" ON "ledger_entries" ("user_id", "created_at") `);
        await queryRunner.query(`CREATE TYPE "public"."transactions_type_enum" AS ENUM('TRANSFER')`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_status_enum" AS ENUM('PENDING', 'COMPLETED', 'REVERSED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "amount" numeric(10,2) NOT NULL, "type" "public"."transactions_type_enum" NOT NULL DEFAULT 'TRANSFER', "status" "public"."transactions_status_enum" NOT NULL DEFAULT 'PENDING', "from_user_id" uuid NOT NULL, "to_user_id" uuid NOT NULL, "description" text, "metadata" text, "reversed_transaction_id" uuid, CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_da87c55b3bbbe96c6ed88ea7ee" ON "transactions" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_7d3ddd65f566201d7124edd23c" ON "transactions" ("to_user_id", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_b117fec138056bcc8b1968a857" ON "transactions" ("from_user_id", "created_at") `);
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "FK_92558c08091598f7a4439586cda" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ledger_entries" ADD CONSTRAINT "FK_8417854ce8bdd0d651c35e1c7ce" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ledger_entries" ADD CONSTRAINT "FK_b26c5ef5853fd6e0a8680427f60" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_2f91a8175c49ac211314033e208" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_cab8dd57a6d6d100a21ddc74679" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_9271d952fa71050fa6da78fbc45" FOREIGN KEY ("reversed_transaction_id") REFERENCES "transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_9271d952fa71050fa6da78fbc45"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_cab8dd57a6d6d100a21ddc74679"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_2f91a8175c49ac211314033e208"`);
        await queryRunner.query(`ALTER TABLE "ledger_entries" DROP CONSTRAINT "FK_b26c5ef5853fd6e0a8680427f60"`);
        await queryRunner.query(`ALTER TABLE "ledger_entries" DROP CONSTRAINT "FK_8417854ce8bdd0d651c35e1c7ce"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "FK_92558c08091598f7a4439586cda"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b117fec138056bcc8b1968a857"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d3ddd65f566201d7124edd23c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_da87c55b3bbbe96c6ed88ea7ee"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1328c522a37c1d883b967d759f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b26c5ef5853fd6e0a8680427f6"`);
        await queryRunner.query(`DROP TABLE "ledger_entries"`);
        await queryRunner.query(`DROP TYPE "public"."ledger_entries_type_enum"`);
        await queryRunner.query(`DROP TABLE "wallets"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
