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
const web3_1 = __importDefault(require("web3"));
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
    const rpcUrl = process.env.LISK_RPC_URL;
    const privateKey = "0xcd1e3ad2e67471d576b5fdca01b715a1f2149d41516e3524fc51589aa44cb9a7";
    if (!rpcUrl || !privateKey) {
        throw new Error('LISK_RPC_URL or ACCOUNT_PRIVATE_KEY environment variables are not defined');
    }
    const web3 = new web3_1.default(new web3_1.default.providers.HttpProvider(rpcUrl));
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    const verifierContract = new web3.eth.Contract(Groth16Verifier_json_1.default.abi, verifierAddress);
    // Prepare the proof parameters
    const proofParams = [
        proof.pi_a.slice(0, 2),
        [
            proof.pi_b[0].reverse(),
            proof.pi_b[1].reverse()
        ],
        proof.pi_c.slice(0, 2),
        publicSignals
    ];
    // Estimate gas and convert it to a string
    const gasEstimate = (await verifierContract.methods.verifyProof(...proofParams).estimateGas({ from: account.address })).toString();
    // Send the transaction to verify the proof
    const receipt = await verifierContract.methods.verifyProof(...proofParams).send({
        from: account.address,
        gas: gasEstimate, // Ensure gas is passed as a string
    });
    // Check if events exist and the ProofVerified event was emitted
    if (receipt.events && receipt.events.ProofVerified) {
        return receipt.events.ProofVerified.returnValues[0];
    }
    // If the event is not present, assume the proof was not verified successfully
    return false;
}
