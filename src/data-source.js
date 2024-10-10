"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./entitiy/User");
const UserDataHash_1 = require("./entitiy/UserDataHash");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'sqlite',
    database: 'database.sqlite',
    synchronize: false,
    logging: true,
    entities: [User_1.User, UserDataHash_1.UserDataHash],
    migrations: ['src/migration/*.ts'],
    subscribers: [],
});
