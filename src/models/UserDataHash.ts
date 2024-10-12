// src/models/UserDataHash.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IUserDataHash extends Document {
    dataHash: string;
    filename: string;
    cid: string; // Store the CID
    encryptedSecret: string;
    user: string; // Reference to User
    createdAt: Date; // Add createdAt to the interface
    updatedAt: Date; // Optionally add updatedAt if you want to use it
}

const UserDataHashSchema: Schema = new Schema({
    dataHash: {
        type: String,
        required: true,
    },
    filename: {
        type: String,
        required: true,
    },
    cid: {
        type: String,
        required: true,
    },
    encryptedSecret: {
        type: String,
        required: true,
    },
    user: {
        type: String,
        ref: 'User', // Reference to User model
        required: true,
    },
}, { timestamps: true }); // This will automatically add createdAt and updatedAt fields

const UserDataHash = mongoose.model<IUserDataHash>('UserDataHash', UserDataHashSchema);
export default UserDataHash;