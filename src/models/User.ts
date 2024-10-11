// models/User.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    username: string;
    passwordHash: string;
    isActive: boolean;
    dataHashes: mongoose.Types.ObjectId[];
}

const UserSchema: Schema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    dataHashes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserDataHash', // Reference to UserDataHash model
    }],
}, { timestamps: true });

const User = mongoose.model<IUser>('User', UserSchema);
export default User;