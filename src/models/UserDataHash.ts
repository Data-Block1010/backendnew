// models/UserDataHash.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IUserDataHash extends Document {
    dataHash: string;
    filename: string;
    cid: string; // Store the CID
    encryptedSecret: string;
    user: mongoose.Types.ObjectId; // Reference to User
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to User model
        required: true,
    },
}, { timestamps: true });

const UserDataHash = mongoose.model<IUserDataHash>('UserDataHash', UserDataHashSchema);
export default UserDataHash;