import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
   name: string;
   website: string;
   email: string;
   integrationPurpose: string;
   maxUsers: number;
   projectDescription: string;
   logo: string;
   status: 'pending' | 'active' | 'suspended';
   walletAddress: string;
   businessDocuments: string[];
   kycRequirements: string[];
   dedicatedPageUrl: string;
   apiKey?: string;
   createdAt: Date;
   updatedAt: Date;
}

const CompanySchema: Schema = new Schema({
   name: { type: String, required: true },
   website: { type: String, required: true },
   email: { type: String, required: true, unique: true },
   integrationPurpose: { type: String, required: true },
   maxUsers: { type: Number, required: true },
   projectDescription: { type: String, required: true },
   logo: { type: String, required: true },
   walletAddress: { type: String, required: true, unique: true },
   businessDocuments: [{ type: String }],
   kycRequirements: [{ type: String }],
   status: {
       type: String,
       enum: ['pending', 'active', 'suspended'],
       default: 'pending'
   },
   dedicatedPageUrl: {
       type: String,
       unique: true
   },
   apiKey: {
       type: String,
       unique: true,
       sparse: true
   }
}, { timestamps: true });

export default mongoose.model<ICompany>('Company', CompanySchema);