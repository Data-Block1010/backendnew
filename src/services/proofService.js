"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProofService = void 0;
exports.generateProof = generateProof;
exports.storeProof = storeProof;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const proof_1 = __importDefault(require("../models/proof"));
// Use exec in async mode
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// Create unique temp directory
async function createTempDir(userId) {
    const tempDir = path_1.default.join(__dirname, `temp/${userId}`);
    await fs.promises.mkdir(tempDir, { recursive: true });
    return tempDir;
}
// Generate and format proof for contract
async function generateProof(inputData, circuitWasmPath, zkeyPath, userId) {
    try {
        // Create temp directory
        const tempDir = await createTempDir(userId);
        // Setup file paths
        const inputJsonPath = path_1.default.join(tempDir, 'input.json');
        const witnessWtnsPath = path_1.default.join(tempDir, 'witness.wtns');
        const proofJsonPath = path_1.default.join(tempDir, 'proof.json');
        const publicJsonPath = path_1.default.join(tempDir, 'public.json');
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
    }
    catch (error) {
        console.error("Error generating proof:", error);
        throw new Error("Proof generation failed");
    }
}
// Store proof in database
async function storeProof(userId, userAddress, proofData) {
    try {
        const proof = new proof_1.default({
            userId,
            userAddress,
            proofData,
            timestamp: new Date()
        });
        return await proof.save();
    }
    catch (error) {
        console.error("Error storing proof:", error);
        throw new Error("Failed to store proof");
    }
}
class ProofService {
    // Get all proofs for a user
    static async getAllProofsForUser(userId) {
        return proof_1.default.find({ userId });
    }
    static async getProofByAddress(userAddress) {
        try {
            const proof = await proof_1.default.findOne({ userAddress })
                .sort({ createdAt: -1 }); // Get the latest proof
            return proof;
        }
        catch (error) {
            console.error("Error getting proof by address:", error);
            throw new Error("Failed to get proof by address");
        }
    }
    // Get all proofs for an address
    static async getAllProofsByAddress(userAddress) {
        try {
            const proofs = await proof_1.default.find({ userAddress })
                .sort({ createdAt: -1 }); // Sort by newest first
            return proofs;
        }
        catch (error) {
            console.error("Error getting proofs by address:", error);
            throw new Error("Failed to get proofs by address");
        }
    }
    // Get single proof by ID
    static async getProofById(proofId) {
        return proof_1.default.findById(proofId);
    }
    // Update proof
    static async updateProof(proofId, updateData) {
        return proof_1.default.findByIdAndUpdate(proofId, updateData, { new: true });
    }
    // Delete proof
    static async deleteProof(proofId) {
        return proof_1.default.findByIdAndDelete(proofId);
    }
}
exports.ProofService = ProofService;
