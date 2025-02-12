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
        try {
            console.log("🔹 Starting wallet authentication...");
            console.log(`🟢 Address: ${address}`);
            console.log(`🟢 Message: ${message}`);
            console.log(`🟢 Signature: ${signature}`);
            console.log(`🟢 Username (if provided): ${username}`);

            if (!address || !message || !signature) {
                throw new Error("Missing required parameters: address, message, or signature.");
            }

            // 🔹 Extract timestamp from the message
            const timestampRegex = /- (.*)$/; // Regex to capture the timestamp
            const match = message.match(timestampRegex);

            if (!match || match.length < 2) {
                throw new Error("Invalid message format: Timestamp missing.");
            }

            const messageTimestamp = new Date(match[1]).getTime();
            const currentTimestamp = Date.now();
            const timeDifference = (currentTimestamp - messageTimestamp) / 1000; // Convert to seconds

            const MAX_ALLOWED_TIME = 300; // 5 minutes (300 seconds)

            if (isNaN(messageTimestamp) || timeDifference > MAX_ALLOWED_TIME) {
                throw new Error("Signature expired: The message timestamp is too old.");
            }

            console.log(`🔹 Message Timestamp: ${new Date(messageTimestamp).toISOString()}`);
            console.log(`🔹 Current Timestamp: ${new Date(currentTimestamp).toISOString()}`);
            console.log(`🔹 Time Difference: ${timeDifference} seconds`);

            // 🔹 Recover the signer’s address from the signed message
            const recoveredAddress = ethers.verifyMessage(message, signature);
            console.log(`🔹 Recovered Address: ${recoveredAddress}`);

            if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
                throw new Error("Invalid signature: Recovered address does not match the provided address.");
            }

            // 🔹 Check if the user exists by wallet address
            let user = await User.findOne({ walletAddress: address });

            if (user) {
                console.log("🔹 User already exists. Proceeding with login...");

                // ✅ Prevent username changes after first registration
                if (username && user.username !== username) {
                    throw new Error("Username cannot be changed after registration.");
                }
            } else {
                // 🔹 If user does not exist, ensure a username is provided for new users
                if (!username) {
                    throw new Error("Username is required for new users.");
                }

                // 🔹 Check if the username is already taken
                const existingUser = await User.findOne({ username });
                if (existingUser) {
                    throw new Error("Username is already taken by another user.");
                }

                // ✅ Create a new user
                user = new User({ walletAddress: address, username });
                await user.save();
                console.log("✅ New user registered successfully.");
            }

            // 🔹 Generate JWT token for authentication
            const token = jwt.sign(
                { userId: user._id, walletAddress: address, username: user.username },
                JWT_SECRET,
                { expiresIn: "1h" }
            );

            console.log("✅ Authentication successful. Token generated.");
            return token;

        } catch (error) {
            console.error("❌ Wallet authentication error:", error);
            
            throw {
                status: 400,
                message: error instanceof Error ? error.message : "An unknown error occurred during authentication",
                details: error instanceof Error ? error.stack : null
            };
        }
    }

    

    static verifyToken(token: string): any {
        return jwt.verify(token, JWT_SECRET);
    }
}