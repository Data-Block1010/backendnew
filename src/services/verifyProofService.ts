import { ethers } from 'ethers';
import Groth16Verifier from './Groth16Verifier.json';
import * as dotenv from "dotenv";
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

dotenv.config();

export async function verifyProofOffChain(proof: any, publicSignals: any, verificationKeyPath: string): Promise<boolean> {
    const proofJsonPath = path.join(__dirname, 'proof.json');
    const publicJsonPath = path.join(__dirname, 'public.json');

    fs.writeFileSync(proofJsonPath, JSON.stringify(proof));
    fs.writeFileSync(publicJsonPath, JSON.stringify(publicSignals));

    const result = execSync(`snarkjs groth16 verify ${verificationKeyPath} ${publicJsonPath} ${proofJsonPath}`).toString();

    return result.includes('OK');
}

export async function verifyProofOnChain(proof: any, publicSignals: any, verifierAddress: string): Promise<boolean> {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.LISK_RPC_URL);
        const privateKey = "0xcd1e3ad2e67471d576b5fdca01b715a1f2149d41516e3524fc51589aa44cb9a7";
        const signer = new ethers.Wallet(privateKey, provider);

        const verifierContract = new ethers.Contract(
            verifierAddress,
            Groth16Verifier.abi,
            signer
        );

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
        const isValid = await verifierContract.verifyProof.staticCall(
            formattedProof.a,
            formattedProof.b,
            formattedProof.c,
            formattedPublicSignals
        );

        console.log("Verification result:", isValid);
        return isValid;

    } catch (error) {
        console.error("Error in verifyProofOnChain:", error);
        throw error;
    }
}

// Helper function to validate input format
function validateProofFormat(proof: any): boolean {
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