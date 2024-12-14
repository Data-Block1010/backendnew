// src/models/KYC.ts
import mongoose, { Document, Schema } from 'mongoose';

// Define the KYC interface
export interface IKYC extends Document {
    name: string;
    dateOfBirth: Date;
    idNumber: string;
    nationality: string;
    kycVerified: boolean;
    createdAt: Date;
    user: mongoose.Types.ObjectId; // Reference to User
    walletAddress: string;        // Added wallet address
    getAge(): number;
}

// Define the KYC schema
const KYCSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
    },
    dateOfBirth: {
        type: Date,
        required: true,
    },
    idNumber: {
        type: String,
        required: true,
        unique: true,
    },
    nationality: {
        type: String,
        required: true,
    },
    kycVerified: {
        type: Boolean,
        default: false,
    },
    walletAddress: {            // Added wallet address field
        type: String,
        unique: true,           // Each wallet address should be unique
        index: true            // Add index for faster queries
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

// Method to calculate age
KYCSchema.methods.getAge = function (): number {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
};

// Add static method to find by wallet address
KYCSchema.statics.findByWalletAddress = function(walletAddress: string) {
    return this.findOne({ walletAddress });
};

// Create interface for model with static methods
interface KYCModel extends mongoose.Model<IKYC> {
    findByWalletAddress(walletAddress: string): Promise<IKYC | null>;
}

// Create a model from the schema
const KYC = mongoose.model<IKYC, KYCModel>('KYC', KYCSchema);

export default KYC;