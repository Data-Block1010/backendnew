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
    getAge(): number; // Method to calculate age
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
        unique: true, // Ensure ID numbers are unique
    },
    nationality: {
        type: String,
        required: true,
    },
    kycVerified: {
        type: Boolean,
        default: false, // Default to false until verified
    },
    createdAt: {
        type: Date,
        default: Date.now, // Automatically set the creation date
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to User model
        required: true, // Ensure that a user is associated with the KYC record
    },
}, { timestamps: true });

// Method to calculate age
KYCSchema.methods.getAge = function (): number {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if the birthday hasn't occurred yet this year
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
};

// Create a model from the schema
const KYC = mongoose.model<IKYC>('KYC', KYCSchema);

export default KYC;