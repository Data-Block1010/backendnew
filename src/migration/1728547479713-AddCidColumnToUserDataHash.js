"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCidColumnToUserDataHash1728547479713 = void 0;
// export class AddCidColumnToUserDataHash1728547479713 implements MigrationInterface {
//     name = 'AddCidColumnToUserDataHash1728547479713'
//     public async up(queryRunner: QueryRunner): Promise<void> {
//         await queryRunner.query(`CREATE TABLE "temporary_user_data_hash" ("id" varchar PRIMARY KEY NOT NULL, "dataHash" varchar NOT NULL, "filename" varchar NOT NULL, "encryptedSecret" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "userId" varchar, "cid" varchar NOT NULL, CONSTRAINT "FK_7dff7996ac0d54ebe688156c4f1" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
//         await queryRunner.query(`INSERT INTO "temporary_user_data_hash"("id", "dataHash", "filename", "encryptedSecret", "createdAt", "userId") SELECT "id", "dataHash", "filename", "encryptedSecret", "createdAt", "userId" FROM "user_data_hash"`);
//         await queryRunner.query(`DROP TABLE "user_data_hash"`);
//         await queryRunner.query(`ALTER TABLE "temporary_user_data_hash" RENAME TO "user_data_hash"`);
//     }
//     public async down(queryRunner: QueryRunner): Promise<void> {
//         await queryRunner.query(`ALTER TABLE "user_data_hash" RENAME TO "temporary_user_data_hash"`);
//         await queryRunner.query(`CREATE TABLE "user_data_hash" ("id" varchar PRIMARY KEY NOT NULL, "dataHash" varchar NOT NULL, "filename" varchar NOT NULL, "encryptedSecret" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "userId" varchar, CONSTRAINT "FK_7dff7996ac0d54ebe688156c4f1" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
//         await queryRunner.query(`INSERT INTO "user_data_hash"("id", "dataHash", "filename", "encryptedSecret", "createdAt", "userId") SELECT "id", "dataHash", "filename", "encryptedSecret", "createdAt", "userId" FROM "temporary_user_data_hash"`);
//         await queryRunner.query(`DROP TABLE "temporary_user_data_hash"`);
//     }
// }
class AddCidColumnToUserDataHash1728547479713 {
    constructor() {
        this.name = 'AddCidColumnToUserDataHash1728547479713';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "temporary_user_data_hash" ("id" varchar PRIMARY KEY NOT NULL, "dataHash" varchar NOT NULL, "filename" varchar NOT NULL, "encryptedSecret" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "userId" varchar, "cid" varchar NOT NULL, CONSTRAINT "FK_7dff7996ac0d54ebe688156c4f1" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        // Include "cid" in the SELECT query
        await queryRunner.query(`INSERT INTO "temporary_user_data_hash"("id", "dataHash", "filename", "encryptedSecret", "createdAt", "userId", "cid") SELECT "id", "dataHash", "filename", "encryptedSecret", "createdAt", "userId", "cid" FROM "user_data_hash"`);
        await queryRunner.query(`DROP TABLE "user_data_hash"`);
        await queryRunner.query(`ALTER TABLE "temporary_user_data_hash" RENAME TO "user_data_hash"`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_data_hash" RENAME TO "temporary_user_data_hash"`);
        await queryRunner.query(`CREATE TABLE "user_data_hash" ("id" varchar PRIMARY KEY NOT NULL, "dataHash" varchar NOT NULL, "filename" varchar NOT NULL, "encryptedSecret" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "userId" varchar, CONSTRAINT "FK_7dff7996ac0d54ebe688156c4f1" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        // Also include "cid" here
        await queryRunner.query(`INSERT INTO "user_data_hash"("id", "dataHash", "filename", "encryptedSecret", "createdAt", "userId", "cid") SELECT "id", "dataHash", "filename", "encryptedSecret", "createdAt", "userId", "cid" FROM "temporary_user_data_hash"`);
        await queryRunner.query(`DROP TABLE "temporary_user_data_hash"`);
    }
}
exports.AddCidColumnToUserDataHash1728547479713 = AddCidColumnToUserDataHash1728547479713;
