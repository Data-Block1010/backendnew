import Web3 from 'web3';
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

export async function verifyProofOnChain(proof: any, publicSignals: any, verifierAddress: string): Promise<any> {
    const rpcUrl = process.env.LISK_RPC_URL;
    const privateKey = "0xcd1e3ad2e67471d576b5fdca01b715a1f2149d41516e3524fc51589aa44cb9a7";

    if (!rpcUrl || !privateKey) {
        throw new Error('LISK_RPC_URL or ACCOUNT_PRIVATE_KEY environment variables are not defined');
    }

    const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);

    const verifierContract = new web3.eth.Contract(Groth16Verifier.abi, verifierAddress);

    // Prepare the proof parameters
    // const proofParams = [
    //     proof.pi_a.slice(0, 2),
    //     [
    //         proof.pi_b[0].reverse(),
    //         proof.pi_b[1].reverse()
    //     ],
    //     proof.pi_c.slice(0, 2),
    //     publicSignals
    // ];
    const proofParams = [
        proof.pi_a.slice(0, 2),  // Take exactly two elements from pi_a
        [
            proof.pi_b[0].reverse(),  // Reverse each element of pi_b
            proof.pi_b[1].reverse()
        ],
        proof.pi_c.slice(0, 2),  // Take exactly two elements from pi_c
        publicSignals  // Pass the full array of publicSignals (which should have 5 elements)
    ];
    console.log("message", proofParams)
    

    // Log proofParams for debugging
    console.log('Proof Params:', proofParams);

    // Set a higher gas limit manually
    const gasLimit = "5000000";  // Example higher gas limit

    // Send the transaction to verify the proof
    const receipt = await verifierContract.methods.verifyProof(...proofParams).send({
        from: account.address,
        gas: gasLimit, // Ensure a high gas limit for debugging
    });

    // Log the transaction receipt for debugging
    console.log('Transaction Receipt:', receipt);

    // Check if events exist and the ProofVerified event was emitted
    if (receipt.events && receipt.events.ProofVerified) {
        // Log the full event object for debugging
        console.log('ProofVerified Event:', receipt.events.ProofVerified);
        return receipt.events.ProofVerified.returnValues;  // Return full event object for better context
    }

    // If the event is not present, assume the proof was not verified successfully
    return false;
}

