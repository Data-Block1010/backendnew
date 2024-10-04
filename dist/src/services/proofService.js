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
exports.generateProof = generateProof;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
// Use `exec` in async mode
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// Function to create unique temp directory for each user session
async function createTempDir(userId) {
    const tempDir = path_1.default.join(__dirname, `temp/${userId}`);
    await fs.promises.mkdir(tempDir, { recursive: true });
    return tempDir;
}
async function generateProof(inputData, circuitWasmPath, zkeyPath, userId // Add userId to ensure unique directories
) {
    try {
        // Create a unique directory for the user session
        const tempDir = await createTempDir(userId);
        // Define paths for user-specific files
        const inputJsonPath = path_1.default.join(tempDir, 'input.json');
        const witnessWtnsPath = path_1.default.join(tempDir, 'witness.wtns');
        const proofJsonPath = path_1.default.join(tempDir, 'proof.json');
        const publicJsonPath = path_1.default.join(tempDir, 'public.json');
        // Write input data to input.json
        await fs.promises.writeFile(inputJsonPath, JSON.stringify(inputData));
        // Generate the witness (asynchronous execution)
        await execAsync(`snarkjs wtns calculate ${circuitWasmPath} ${inputJsonPath} ${witnessWtnsPath}`);
        // Generate the proof (asynchronous execution)
        await execAsync(`snarkjs groth16 prove ${zkeyPath} ${witnessWtnsPath} ${proofJsonPath} ${publicJsonPath}`);
        // Read and return the generated proof and public signals
        const proof = JSON.parse(await fs.promises.readFile(proofJsonPath, 'utf8'));
        const publicSignals = JSON.parse(await fs.promises.readFile(publicJsonPath, 'utf8'));
        // Optionally clean up the temporary files after generation (if needed)
        await fs.promises.rm(tempDir, { recursive: true, force: true });
        return { proof, publicSignals };
    }
    catch (error) {
        console.error("Error generating proof:", error);
        throw new Error("Proof generation failed");
    }
}
