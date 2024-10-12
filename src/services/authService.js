"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
// src/services/authService.ts
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User")); // Update the import path to your User model
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
class AuthService {
    static async register(username, password) {
        const existingUser = await User_1.default.findOne({ username }); // Use Mongoose syntax
        if (existingUser) {
            throw new Error('Username already exists');
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = new User_1.default({ username, passwordHash }); // Create a new instance of User
        await user.save(); // Save the user to the database
    }
    static async login(username, password) {
        const user = await User_1.default.findOne({ username }); // Use Mongoose syntax
        if (!user || !(await bcryptjs_1.default.compare(password, user.passwordHash))) {
            throw new Error('Invalid credentials');
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' }); // Use _id for MongoDB
        return token;
    }
    static verifyToken(token) {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
}
exports.AuthService = AuthService;
