// src/models/WaitlistEntry.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IWaitlistEntry extends Document {
  email: string;
  name: string;
  position: number;
  joinedAt: Date;
  status: 'waiting' | 'invited' | 'joined';
}

const waitlistSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  position: {
    type: Number,
    required: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['waiting', 'invited', 'joined'],
    default: 'waiting',
  },
}, { timestamps: true });

export const WaitlistEntry = mongoose.model<IWaitlistEntry>('WaitlistEntry', waitlistSchema);
