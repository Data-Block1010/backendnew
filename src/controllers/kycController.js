"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KYCController = void 0;
const kycService_1 = require("../services/kycService"); // Import the KYC service
class KYCController {
    // Method to create a new KYC record
    static async createKYC(req, res) {
        try {
            const { name, dateOfBirth, idNumber, nationality } = req.body;
            const userId = req.user; // Assuming you have userId in the request (e.g., from a token)
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            await kycService_1.KYCService.createKYC({ name, dateOfBirth, idNumber, nationality, userId });
            res.status(201).json({ message: 'KYC record created successfully' });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            res.status(400).json({ error: errorMessage });
        }
    }
    // Method to retrieve a KYC record by ID
    static async getKYCById(req, res) {
        try {
            const kycId = req.params.id;
            const kycRecord = await kycService_1.KYCService.getKYCById(kycId);
            res.status(200).json(kycRecord);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'KYC record not found';
            res.status(404).json({ error: errorMessage });
        }
    }
    static async getAllKYCForUser(req, res) {
        try {
            const userId = req.user; // Assuming you have the userId from token or middleware
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            // // Fetch the user's MongoDB object ID using the userId
            // const user = await User.findOne({ _id: userId });
            // if (!user) {
            //     return res.status(404).json({ error: 'User not found' });
            // }
            // const userMongoId = user._id; // MongoDB object ID
            // Fetch KYC records using the user's MongoDB object ID
            const kycRecords = await kycService_1.KYCService.getAllKYCForUser(userId);
            res.status(200).json(kycRecords);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error retrieving KYC records';
            res.status(500).json({ error: errorMessage });
        }
    }
    // Method to update a KYC record
    static async updateKYC(req, res) {
        try {
            const kycId = req.params.id;
            const data = req.body;
            await kycService_1.KYCService.updateKYC(kycId, data);
            res.status(200).json({ message: 'KYC record updated successfully' });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'KYC record not found';
            res.status(404).json({ error: errorMessage });
        }
    }
    // Method to delete a KYC record
    static async deleteKYC(req, res) {
        try {
            const kycId = req.params.id;
            await kycService_1.KYCService.deleteKYC(kycId);
            res.status(200).json({ message: 'KYC record deleted successfully' });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'KYC record not found';
            res.status(404).json({ error: errorMessage });
        }
    }
}
exports.KYCController = KYCController;
