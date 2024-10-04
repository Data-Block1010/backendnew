"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const users = [];
class UserModel {
    static async findUserByUsername(username) {
        return users.find(user => user.username === username);
    }
    static async createUser(username, passwordHash) {
        users.push({ id: new Date().toISOString(), username, passwordHash });
    }
}
exports.UserModel = UserModel;
