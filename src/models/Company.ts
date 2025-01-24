import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
    name: string;
    email: string;
    walletAddress: string;
    businessDocuments: string[];
    kycRequirements: string[];
    status: 'pending' | 'active' | 'suspended';
    dedicatedPageUrl: string;
    apiKey?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CompanySchema: Schema = new Schema({
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    walletAddress: { 
        type: String, 
        required: true, 
        unique: true 
    },
    businessDocuments: [{ 
        type: String 
    }],
    kycRequirements: [{ 
        type: String 
    }],
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
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

export default mongoose.model<ICompany>('Company', CompanySchema);