import { exec } from 'child_process';
import * as fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import Proof from '../models/proof';

// Use exec in async mode
const execAsync = promisify(exec);

// Create unique temp directory
async function createTempDir(userId: string): Promise<string> {
    const tempDir = path.join(__dirname, `temp/${userId}`);
    await fs.promises.mkdir(tempDir, { recursive: true });
    return tempDir;
}

// Generate and format proof for contract
export async function generateProof(
    inputData: any,
    circuitWasmPath: string,
    zkeyPath: string,
    userId: string
): Promise<{
    proof: {
        a: string[];
        b: string[][];
        c: string[];
    };
    publicSignals: string[];
}> {
    try {
        // Create temp directory
        const tempDir = await createTempDir(userId);

        // Setup file paths
        const inputJsonPath = path.join(tempDir, 'input.json');
        const witnessWtnsPath = path.join(tempDir, 'witness.wtns');
        const proofJsonPath = path.join(tempDir, 'proof.json');
        const publicJsonPath = path.join(tempDir, 'public.json');

        // Write input data
        await fs.promises.writeFile(inputJsonPath, JSON.stringify(inputData));

        // Generate witness
        await execAsync(`snarkjs wtns calculate ${circuitWasmPath} ${inputJsonPath} ${witnessWtnsPath}`);

        // Generate proof
        await execAsync(`snarkjs groth16 prove ${zkeyPath} ${witnessWtnsPath} ${proofJsonPath} ${publicJsonPath}`);

        // Read generated files
        const proof = JSON.parse(await fs.promises.readFile(proofJsonPath, 'utf8'));
        const publicSignals = JSON.parse(await fs.promises.readFile(publicJsonPath, 'utf8'));

        // Clean up temp files
        await fs.promises.rm(tempDir, { recursive: true, force: true });

        // Format proof for smart contract
        const formattedProof = {
            // First two elements of pi_a
            a: [
                proof.pi_a[0],
                proof.pi_a[1]
            ],
            // Switch coordinates in pi_b
            b: [
                [
                    proof.pi_b[0][1],
                    proof.pi_b[0][0]
                ],
                [
                    proof.pi_b[1][1],
                    proof.pi_b[1][0]
                ]
            ],
            // First two elements of pi_c
            c: [
                proof.pi_c[0],
                proof.pi_c[1]
            ]
        };

        // Take first 5 public signals
        const formattedPublicSignals = publicSignals.slice(0, 5);

        return {
            proof: formattedProof,
            publicSignals: formattedPublicSignals
        };

    } catch (error) {
        console.error("Error generating proof:", error);
        throw new Error("Proof generation failed");
    }
}

// Store proof in database
export async function storeProof(userId: string,userAddress: string, proofData: any): Promise<any> {
    try {
        const proof = new Proof({
            userId,
            userAddress,
            proofData,
            timestamp: new Date()
        });
        return await proof.save();
    } catch (error) {
        console.error("Error storing proof:", error);
        throw new Error("Failed to store proof");
    }
}



export class ProofService {
    // Get all proofs for a user
    static async getAllProofsForUser(userId: string) {
        return Proof.find({ userId });
    }
    static async getProofByAddress(userAddress: string) {
        try {
            const proof = await Proof.findOne({ userAddress })
                .sort({ createdAt: -1 }); // Get the latest proof
            return proof;
        } catch (error) {
            console.error("Error getting proof by address:", error);
            throw new Error("Failed to get proof by address");
        }
    }
    
    // Get all proofs for an address
    static async getAllProofsByAddress(userAddress: string) {
        try {
            const proofs = await Proof.find({ userAddress })
                .sort({ createdAt: -1 }); // Sort by newest first
            return proofs;
        } catch (error) {
            console.error("Error getting proofs by address:", error);
            throw new Error("Failed to get proofs by address");
        }
    }
    // Get single proof by ID
    static async getProofById(proofId: string) {
        return Proof.findById(proofId);
    }

    // Update proof
    static async updateProof(proofId: string, updateData: any) {
        return Proof.findByIdAndUpdate(proofId, updateData, { new: true });
    }

    // Delete proof
    static async deleteProof(proofId: string) {
        return Proof.findByIdAndDelete(proofId);
    }

    
}