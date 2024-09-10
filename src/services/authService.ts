// src/services/authService.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../entitiy/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export class AuthService {
    static async register(username: string, password: string): Promise<void> {
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            throw new Error('Username already exists');
        }
        
        const passwordHash = await bcrypt.hash(password, 10);
        const user = User.create({ username, passwordHash });
        await user.save();
    }

    static async login(username: string, password: string): Promise<string> {
        const user = await User.findOne({ where: { username } });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            throw new Error('Invalid credentials');
        }
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
        return token;
    }

    static verifyToken(token: string): any {
        return jwt.verify(token, JWT_SECRET);
    }
}
