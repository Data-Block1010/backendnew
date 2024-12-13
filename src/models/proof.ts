import mongoose, { Schema, Document } from 'mongoose';

interface IProof extends Document {
    _id: mongoose.Types.ObjectId;
    userId: string;
    userAddress: string;  // Added user wallet address
    proofData: object;
    publicSignals: object;
    createdAt: Date;
}

const ProofSchema: Schema = new Schema({
    userId: { 
        type: String, 
        required: true 
    },
    userAddress: { 
        type: String, 
        required: true,
        index: true     // Add index for faster queries
    },
    proofData: { 
        type: Object, 
        required: true 
    },
    publicSignals: { 
        type: Object, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Add index for both userId and userAddress for faster compound queries
ProofSchema.index({ userId: 1, userAddress: 1 });

const Proof = mongoose.model<IProof>('Proof', ProofSchema);

export default Proof;