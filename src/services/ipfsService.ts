import axios from 'axios';
import crypto from 'crypto-js';
import * as dotenv from 'dotenv';
import FormData from 'form-data';

// Load environment variables from .env file
dotenv.config();

export class IpfsService {
    static async uploadFile(fileContent: Buffer): Promise<string> {
        const pinataApiUrl = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
        const options = {
            headers: {
                'pinata_api_key': process.env.PINATA_API_KEY || '',
                'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY || '',
                'Content-Type': 'multipart/form-data'
            }
        };

        try {
            console.log("Preparing file upload to Pinata API...");

            const formData = new FormData();
            formData.append('file', fileContent, { filename: 'encryptedFile.txt' });  // Attach the file as form-data

            console.log("Form data created. Uploading to Pinata...");

            const response = await axios.post(pinataApiUrl, formData, options);
            const cid = response.data.IpfsHash;

            console.log("File uploaded successfully, CID:", cid);
            return cid;  // Return the CID (Content Identifier)
        } catch (error) {
            if (axios.isAxiosError(error)) {
                // Handle Axios-specific errors
                console.error("Axios error:", error.response?.data || error.message);
            } else if (error instanceof Error) {
                // Handle general errors
                console.error("General error:", error.message);
            } else {
                console.error("Unknown error occurred during file upload");
            }

            throw new Error("Failed to upload file to Pinata API");
        }
    }

    static encryptData(data: string, secretKey: string): string {
        console.log("Encrypting data...");
        const encrypted = crypto.AES.encrypt(data, secretKey).toString();
        console.log("Data encrypted successfully.");
        return encrypted;
    }

    static decryptData(encryptedData: string, secretKey: string): string {
        console.log("Decrypting data...");
        const bytes = crypto.AES.decrypt(encryptedData, secretKey);
        const decrypted = bytes.toString(crypto.enc.Utf8);
        console.log("Data decrypted successfully.");
        return decrypted;
    }

    static hashData(data: string): string {
        console.log("Hashing data...");
        const hash = crypto.SHA256(data).toString();
        console.log("Data hashed successfully:", hash);
        return hash;
    }
}
