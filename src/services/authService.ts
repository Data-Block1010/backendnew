// src/services/authService.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User'; 
import { ethers } from "ethers";// Update the import path to your User model

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
        const user = await User.findOne({ username });
        if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
            throw new Error('Invalid credentials');
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
        return token;
    }

    static async authenticateWithWallet(
        address: string,
        message: string,
        signature: string,
        username?: string
    ): Promise<string> {
        // Recover the address from the signed message
        const recoveredAddress = ethers.verifyMessage(message, signature);

        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            throw new Error("Invalid signature");
        }

        // Check if the username already exists in the database
        if (username) {
            const existingUserWithUsername = await User.findOne({ username });

            // If the username exists, ensure it belongs to the same wallet address
            if (existingUserWithUsername && existingUserWithUsername.walletAddress.toLowerCase() !== address.toLowerCase()) {
                throw new Error("Username is already taken by another user");
            }
        }

        // Check if the user exists based on wallet address
        let user = await User.findOne({ walletAddress: address });

        // If the user does not exist, register them with the provided username
        if (!user) {
            if (!username) {
                throw new Error("Username is required for new users");
            }

            user = new User({ walletAddress: address, username });
            await user.save();
        } else if (username && user.username !== username) {
            // Prevent username changes after first registration
            throw new Error("Username cannot be changed after registration");
        }

        // Generate a JWT token including username and walletAddress
        const token = jwt.sign(
            { userId: user._id, walletAddress: address, username: user.username },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        return token;
    }


    static verifyToken(token: string): any {
        return jwt.verify(token, JWT_SECRET);
    }
}