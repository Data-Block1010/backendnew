import { exec } from 'child_process';
import * as fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Use `exec` in async mode
const execAsync = promisify(exec);

// Function to create unique temp directory for each user session
async function createTempDir(userId: string): Promise<string> {
    const tempDir = path.join(__dirname, `temp/${userId}`);
    await fs.promises.mkdir(tempDir, { recursive: true });
    return tempDir;
}

export async function generateProof(
    inputData: any, 
    circuitWasmPath: string, 
    zkeyPath: string, 
    userId: string // Add userId to ensure unique directories
): Promise<{ proof: any; publicSignals: any }> {
    try {
        // Create a unique directory for the user session
        const tempDir = await createTempDir(userId);

        // Define paths for user-specific files
        const inputJsonPath = path.join(tempDir, 'input.json');
        const witnessWtnsPath = path.join(tempDir, 'witness.wtns');
        const proofJsonPath = path.join(tempDir, 'proof.json');
        const publicJsonPath = path.join(tempDir, 'public.json');

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
    } catch (error) {
        console.error("Error generating proof:", error);
        throw new Error("Proof generation failed");
    }
}
