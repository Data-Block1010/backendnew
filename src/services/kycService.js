"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KYCService = void 0;
// src/services/kycService.ts
const KYC_1 = __importDefault(require("../models/KYC")); // Import the KYC model
class KYCService {
    // Method to create a new KYC record
    static async createKYC(data) {
        const { name, dateOfBirth, idNumber, nationality, userId } = data;
        const newKYC = new KYC_1.default({
            name,
            dateOfBirth,
            idNumber,
            nationality,
            kycVerified: true, // Set kycVerified to true upon creation
            user: userId, // Associate the KYC record with the user
        });
        await newKYC.save();
    }
    // Method to retrieve a KYC record by ID
    static async getKYCById(kycId) {
        const kycRecord = await KYC_1.default.findById(kycId);
        if (!kycRecord) {
            throw new Error('KYC record not found');
        }
        return kycRecord;
    }
    static async getAllKYCForUser(userId) {
        try {
            const kycRecords = await KYC_1.default.find({ user: userId });
            return kycRecords;
        }
        catch (error) {
            throw new Error('Error retrieving KYC records');
        }
    }
    // Method to update a KYC record
    static async updateKYC(kycId, data) {
        const kycRecord = await KYC_1.default.findByIdAndUpdate(kycId, data, { new: true });
        if (!kycRecord) {
            throw new Error('KYC record not found');
        }
    }
    // Method to delete a KYC record
    static async deleteKYC(kycId) {
        const kycRecord = await KYC_1.default.findByIdAndDelete(kycId);
        if (!kycRecord) {
            throw new Error('KYC record not found');
        }
    }
}
exports.KYCService = KYCService;
