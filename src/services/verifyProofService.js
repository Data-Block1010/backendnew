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
exports.verifyProofOffChain = verifyProofOffChain;
exports.verifyProofOnChain = verifyProofOnChain;
const ethers_1 = require("ethers");
const Groth16Verifier_json_1 = __importDefault(require("./Groth16Verifier.json"));
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
dotenv.config();
async function verifyProofOffChain(proof, publicSignals, verificationKeyPath) {
    const proofJsonPath = path_1.default.join(__dirname, 'proof.json');
    const publicJsonPath = path_1.default.join(__dirname, 'public.json');
    fs_1.default.writeFileSync(proofJsonPath, JSON.stringify(proof));
    fs_1.default.writeFileSync(publicJsonPath, JSON.stringify(publicSignals));
    const result = (0, child_process_1.execSync)(`snarkjs groth16 verify ${verificationKeyPath} ${publicJsonPath} ${proofJsonPath}`).toString();
    return result.includes('OK');
}
async function verifyProofOnChain(proof, publicSignals, verifierAddress) {
    try {
        const provider = new ethers_1.ethers.JsonRpcProvider(process.env.LISK_RPC_URL);
        const privateKey = "0xcd1e3ad2e67471d576b5fdca01b715a1f2149d41516e3524fc51589aa44cb9a7";
        const signer = new ethers_1.ethers.Wallet(privateKey, provider);
        const verifierContract = new ethers_1.ethers.Contract(verifierAddress, Groth16Verifier_json_1.default.abi, signer);
        // Format the proof
        const formattedProof = {
            a: proof.pi_a.slice(0, 2).map(String),
            b: [
                [proof.pi_b[0][1], proof.pi_b[0][0]].map(String),
                [proof.pi_b[1][1], proof.pi_b[1][0]].map(String)
            ],
            c: proof.pi_c.slice(0, 2).map(String)
        };
        // Ensure we have exactly 5 public signals
        const formattedPublicSignals = publicSignals.slice(0, 5).map(String);
        if (formattedPublicSignals.length !== 5) {
            throw new Error(`Expected 5 public signals but got ${formattedPublicSignals.length}`);
        }
        console.log("Verifying with parameters:");
        console.log("a:", formattedProof.a);
        console.log("b:", formattedProof.b);
        console.log("c:", formattedProof.c);
        console.log("publicSignals:", formattedPublicSignals);
        // Call verifyProof with properly formatted arrays
        const isValid = await verifierContract.verifyProof.staticCall(formattedProof.a, formattedProof.b, formattedProof.c, formattedPublicSignals);
        console.log("Verification result:", isValid);
        return isValid;
    }
    catch (error) {
        console.error("Error in verifyProofOnChain:", error);
        throw error;
    }
}
// Helper function to validate input format
function validateProofFormat(proof) {
    if (!proof.pi_a || !proof.pi_b || !proof.pi_c) {
        return false;
    }
    if (proof.pi_a.length < 2 || proof.pi_b.length < 2 || proof.pi_c.length < 2) {
        return false;
    }
    if (!Array.isArray(proof.pi_b[0]) || !Array.isArray(proof.pi_b[1])) {
        return false;
    }
    return true;
}
