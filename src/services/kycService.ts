// src/services/kycService.ts
import KYC from '../models/KYC'; // Import the KYC model

export class KYCService {
    // Method to create a new KYC record
    static async createKYC(data: {
        name: string;
        dateOfBirth: Date;
        idNumber: string;
        nationality: string;
        userId: string; // Add userId to the parameters
    }): Promise<void> {
        const { name, dateOfBirth, idNumber, nationality, userId } = data;

        const newKYC = new KYC({
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
    static async getKYCById(kycId: string): Promise<any> {
        const kycRecord = await KYC.findById(kycId);
        if (!kycRecord) {
            throw new Error('KYC record not found');
        }
        return kycRecord;
    }
    static async getAllKYCForUser(userId: string) {
        try {
            const kycRecords = await KYC.find({ user: userId });
            return kycRecords;
        } catch (error) {
            throw new Error('Error retrieving KYC records');
        }
    }

    // Method to update a KYC record
    static async updateKYC(kycId: string, data: Partial<{ name: string; dateOfBirth: Date; idNumber: string; nationality: string; }>): Promise<void> {
        const kycRecord = await KYC.findByIdAndUpdate(kycId, data, { new: true });
        if (!kycRecord) {
            throw new Error('KYC record not found');
        }
    }

    // Method to delete a KYC record
    static async deleteKYC(kycId: string): Promise<void> {
        const kycRecord = await KYC.findByIdAndDelete(kycId);
        if (!kycRecord) {
            throw new Error('KYC record not found');
        }
    }
}