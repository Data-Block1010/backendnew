// src/services/authService.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User'; // Update the import path to your User model

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export class AuthService {
    static async register(username: string, password: string): Promise<void> {
        const existingUser = await User.findOne({ username }); // Use Mongoose syntax
        if (existingUser) {
            throw new Error('Username already exists');
        }
        
        const passwordHash = await bcrypt.hash(password, 10);
        const user = new User({ username, passwordHash }); // Create a new instance of User
        await user.save(); // Save the user to the database
    }

    static async login(username: string, password: string): Promise<string> {
        const user = await User.findOne({ username }); // Use Mongoose syntax
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            throw new Error('Invalid credentials');
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' }); // Use _id for MongoDB
        return token;
    }

    static verifyToken(token: string): any {
        return jwt.verify(token, JWT_SECRET);
    }
}