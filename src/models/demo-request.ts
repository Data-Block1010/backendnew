import { Schema, model, Document } from 'mongoose';

export interface IDemoRequest extends Document {
  name: string;
  email: string;
  company: string;
  position?: string;
  phoneNumber?: string;
  message?: string;
  waitlistPosition: number;
  status: 'pending' | 'contacted' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt?: Date;
}

const demoRequestSchema = new Schema<IDemoRequest>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  company: {
    type: String,
    required: true,
    trim: true,
  },
  position: {
    type: String,
    trim: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  message: {
    type: String,
    trim: true,
  },
  waitlistPosition: {
    type: Number,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'completed', 'cancelled'],
    default: 'pending',
  },
  lastContactedAt: {
    type: Date,
  },
}, {
  timestamps: true,
  collection: 'demoRequests'
});

// Indexes for better query performance
demoRequestSchema.index({ email: 1 }, { unique: false });
demoRequestSchema.index({ waitlistPosition: 1 }, { unique: true });
demoRequestSchema.index({ status: 1 });
demoRequestSchema.index({ createdAt: 1 });

export const DemoRequest = model<IDemoRequest>('DemoRequest', demoRequestSchema);
