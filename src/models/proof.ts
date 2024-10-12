import mongoose, { Schema, Document } from 'mongoose';

interface IProof extends Document {
    _id: mongoose.Types.ObjectId;
    userId: string; 
    proofData: object; 
    publicSignals: object; 
    createdAt: Date; 
}

const ProofSchema: Schema = new Schema({
    userId: { type: String, required: true },
    proofData: { type: Object, required: true },
    publicSignals: { type: Object, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Proof = mongoose.model<IProof>('Proof', ProofSchema);
export default Proof;
