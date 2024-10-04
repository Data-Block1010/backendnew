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
exports.IpfsService = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_js_1 = __importDefault(require("crypto-js"));
const dotenv = __importStar(require("dotenv"));
const form_data_1 = __importDefault(require("form-data"));
// Load environment variables from .env file
dotenv.config();
class IpfsService {
    static async uploadFile(fileContent) {
        var _a;
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
            const formData = new form_data_1.default();
            formData.append('file', fileContent, { filename: 'encryptedFile.txt' }); // Attach the file as form-data
            console.log("Form data created. Uploading to Pinata...");
            const response = await axios_1.default.post(pinataApiUrl, formData, options);
            const cid = response.data.IpfsHash;
            console.log("File uploaded successfully, CID:", cid);
            return cid; // Return the CID (Content Identifier)
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                // Handle Axios-specific errors
                console.error("Axios error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            }
            else if (error instanceof Error) {
                // Handle general errors
                console.error("General error:", error.message);
            }
            else {
                console.error("Unknown error occurred during file upload");
            }
            throw new Error("Failed to upload file to Pinata API");
        }
    }
    static encryptData(data, secretKey) {
        console.log("Encrypting data...");
        const encrypted = crypto_js_1.default.AES.encrypt(data, secretKey).toString();
        console.log("Data encrypted successfully.");
        return encrypted;
    }
    static decryptData(encryptedData, secretKey) {
        console.log("Decrypting data...");
        const bytes = crypto_js_1.default.AES.decrypt(encryptedData, secretKey);
        const decrypted = bytes.toString(crypto_js_1.default.enc.Utf8);
        console.log("Data decrypted successfully.");
        return decrypted;
    }
    static hashData(data) {
        console.log("Hashing data...");
        const hash = crypto_js_1.default.SHA256(data).toString();
        console.log("Data hashed successfully:", hash);
        return hash;
    }
}
exports.IpfsService = IpfsService;
