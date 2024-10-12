"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const proofService_1 = require("../services/proofService"); // Adjust path as necessary
class ProofController {
    // Generate a proof
    // static async generate(req: Request, res: Response) {
    //     try {
    //         const { inputData, circuitWasmPath, zkeyPath } = req.body;
    //         const userId = req.user._id; // Assuming user ID is available in req.user
    //         if (!inputData || !circuitWasmPath || !zkeyPath) {
    //             return res.status(400).json({ error: 'Missing required fields' });
    //         }
    //         const { proof, publicSignals } = await generateProof(inputData, circuitWasmPath, zkeyPath, userId);
    //         // Save the proof to the database if needed
    //         const newProof = new ProofService({ userId, proof, publicSignals });
    //         await newProof.save();
    //         res.status(201).json({ proof, publicSignals });
    //     } catch (error) {
    //         console.error('Error generating proof:', error);
    //         res.status(500).json({ error: error });
    //     }
    // }
    // Get all proofs for a user
    static async getAll(req, res) {
        try {
            const userId = req.user; // Assuming user ID is available in req.user
            // Log the user ID being used to fetch proofs
            console.log('Fetching proofs for user ID:', userId);
            // Fetch proofs for the user
            const proofs = await proofService_1.ProofService.getAllProofsForUser(userId);
            // Log the number of proofs retrieved
            console.log(`Number of proofs retrieved for user ID ${userId}:`, proofs.length);
            res.status(200).json(proofs);
        }
        catch (error) {
            // Log the error for debugging
            console.error('Error retrieving proofs:', error);
            // Send error response
            res.status(500).json({ error: 'An error occurred while retrieving proofs' });
        }
    }
    // Get a proof by ID
    static async getById(req, res) {
        try {
            const { proofId } = req.params; // Expecting proofId in the request params
            const proof = await proofService_1.ProofService.getProofById(proofId);
            if (!proof) {
                return res.status(404).json({ error: 'Proof not found' });
            }
            res.status(200).json(proof);
        }
        catch (error) {
            console.error('Error retrieving proof:', error);
            res.status(500).json({ error: error });
        }
    }
    // Update a proof by ID
    static async update(req, res) {
        try {
            const { proofId } = req.params; // Expecting proofId in the request params
            const updateData = req.body; // Expecting update data in the request body
            const updatedProof = await proofService_1.ProofService.updateProof(proofId, updateData);
            if (!updatedProof) {
                return res.status(404).json({ error: 'Proof not found' });
            }
            res.status(200).json(updatedProof);
        }
        catch (error) {
            console.error('Error updating proof:', error);
            res.status(500).json({ error: error });
        }
    }
    // Delete a proof by ID
    static async delete(req, res) {
        try {
            const { proofId } = req.params; // Expecting proofId in the request params
            const deletedProof = await proofService_1.ProofService.deleteProof(proofId);
            if (!deletedProof) {
                return res.status(404).json({ error: 'Proof not found' });
            }
            res.status(204).send(); // No content to send back for a successful delete
        }
        catch (error) {
            console.error('Error deleting proof:', error);
            res.status(500).json({ error: error });
        }
    }
}
exports.default = ProofController;
