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
exports.DataController = void 0;
const multer_1 = __importDefault(require("multer"));
const ipfsService_1 = require("../services/ipfsService");
const zkSyncService_1 = require("../services/zkSyncService");
const UserDataHash_1 = require("../entitiy/UserDataHash"); // Import UserDataHash entity
const User_1 = require("../entitiy/User"); // Import User entity
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
const proofService_1 = require("../services/proofService");
const authService_1 = require("../services/authService");
dotenv.config();
const ownerAddress = String(process.env.OWNER_ADDRESS);
const upload = (0, multer_1.default)(); // Initialize multer for handling file uploads
const zkSyncService = new zkSyncService_1.ZkSyncService();
class DataController {
    static async viewData(req, res) {
        try {
            const { dataHash, secretKey } = req.body;
            // Fetch the data from the zkSync L2 network using the data hash
            const dataRecord = await zkSyncService.getDataByHash(ownerAddress, dataHash);
            if (!dataRecord) {
                return res.status(404).json({ error: "Data not found" });
            }
            const storedDataHash = dataRecord[0]; // Extract dataHash from the retrieved data
            const owner = dataRecord[1]; // Extract owner from the retrieved data
            // Fetch the encrypted data from IPFS using the retrieved data hash (CID)
            const fileUrl = `https://gateway.pinata.cloud/ipfs/${storedDataHash}`;
            const response = await axios_1.default.get(fileUrl);
            const encryptedData = response.data;
            // Decrypt the data using the provided secret key
            const decryptedData = ipfsService_1.IpfsService.decryptData(encryptedData, secretKey);
            res.json({ decryptedData, owner });
        }
        catch (error) {
            console.error("Error in viewData:", error.message);
            res.status(500).json({ error: error.message });
        }
    }
    // Other methods stay the same
    static async generateUserProof(req, res) {
        try {
            const { username, secretKey, filename, circuitWasmPath, zkeyPath, inputData } = req.body;
            if (!username || !secretKey || !filename || !circuitWasmPath || !zkeyPath || !inputData) {
                return res.status(400).json({ error: "Missing required fields" });
            }
            console.log("Request Body:", req.body); // Log the entire request body
            const user = await User_1.User.findOne({ where: { username } });
            console.log("User found:", user); // Log the user object
            if (!user) {
                console.error("User not found for username:", username);
                return res.status(404).json({ error: "User not found" });
            }
            // Fetch the data hash from zkSync L2 network
            const userDataHash = await UserDataHash_1.UserDataHash.findOne({ where: { user, filename } });
            console.log("User Data Hash found:", userDataHash); // Log the user data hash
            if (!userDataHash) {
                console.error("User data hash not found for filename:", filename);
                return res.status(404).json({ error: "User data hash not found" });
            }
            let hash = userDataHash.dataHash;
            if (!hash) {
                return hash = inputData;
            }
            // Fetch the encrypted data from IPFS using the data hash (CID)
            const fileUrl = `https://gateway.pinata.cloud/ipfs/${hash}`; // Use the dataHash property
            console.log("Fetching encrypted data from URL:", fileUrl); // Log the URL being fetched
            const response = await axios_1.default.get(fileUrl);
            const encryptedData = response.data;
            // Decrypt the data using the provided secret key
            console.log("Encrypted data fetched successfully."); // Log success message
            const decryptedData = ipfsService_1.IpfsService.decryptData(encryptedData, secretKey);
            console.log("Decrypted data successfully."); // Log success message
            // Generate a cryptographic proof
            const { proof, publicSignals } = await (0, proofService_1.generateProof)(decryptedData, circuitWasmPath, zkeyPath, user.id // Assuming userId is the user's ID
            );
            res.json({ proof, publicSignals });
        }
        catch (error) {
            console.error("Error in generateUserProof:", error.message);
            console.error("Stack Trace:", error.stack); // Log the stack trace for more context
            res.status(500).json({ error: error.message });
        }
    }
    static async storeData(req, res) {
        try {
            const { secretKey, username } = req.body; // Assuming username is provided
            const file = req.file;
            if (!file) {
                return res.status(400).json({ error: "No file uploaded" });
            }
            // Convert the file buffer to a string and encrypt the content
            const fileContent = file.buffer.toString('base64');
            const encryptedContent = ipfsService_1.IpfsService.encryptData(fileContent, secretKey);
            // Upload encrypted content to IPFS and hash it
            const cid = await ipfsService_1.IpfsService.uploadFile(Buffer.from(encryptedContent));
            console.log(cid);
            const dataHash = ipfsService_1.IpfsService.hashData(cid);
            // Store the data hash on the zkSync L2 network
            const txHash = await zkSyncService.storeData(dataHash);
            console.log(txHash);
            // Find the user by username
            const user = await User_1.User.findOne({ where: { username } });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            // Store the data hash, filename, and encrypted secret in the database
            const userDataHash = new UserDataHash_1.UserDataHash();
            userDataHash.dataHash = dataHash;
            userDataHash.filename = file.originalname; // Store the file's original name
            userDataHash.encryptedSecret = secretKey; // Assuming you store encrypted secrets
            userDataHash.user = user;
            await userDataHash.save(); // Save the entry in the database
            res.json({ txHash, cid, message: "Data stored successfully" });
        }
        catch (error) {
            console.error("Error in storeData:", error.message);
            res.status(500).json({ error: error.message });
        }
    }
    static async updateData(req, res) {
        try {
            const { secretKey, cid, username } = req.body;
            const file = req.file;
            if (!file) {
                return res.status(400).json({ error: "No file uploaded" });
            }
            // Convert the file buffer to a string and encrypt the new content
            const fileContent = file.buffer.toString('base64');
            const encryptedContent = ipfsService_1.IpfsService.encryptData(fileContent, secretKey);
            // Upload the new encrypted content to IPFS and hash it
            const newCid = await ipfsService_1.IpfsService.uploadFile(Buffer.from(encryptedContent));
            const newDataHash = ipfsService_1.IpfsService.hashData(newCid);
            // Fetch all data records from the blockchain using the getAllData method
            const dataRecords = await zkSyncService.getAllData(ownerAddress);
            console.log(dataRecords);
            if (!dataRecords || dataRecords.length === 0) {
                return res.status(404).json({ error: "No data records found for the user" });
            }
            // Find the index of the data record that matches the provided cid (data hash)
            let index = -1;
            for (let i = 0; i < dataRecords.length; i++) {
                if (dataRecords[i].dataHash === cid) {
                    index = i;
                    break;
                }
            }
            if (index === -1) {
                return res.status(404).json({ error: "Data hash not found in the user's records" });
            }
            // Update the data on the zkSync L2 network using the found index
            const txHash = await zkSyncService.updateData(index, newDataHash);
            // Find the user by ownerAddress and update their stored data hash
            const user = await User_1.User.findOne({ where: { username } });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            const userDataHash = await UserDataHash_1.UserDataHash.findOne({ where: { user, dataHash: cid } });
            if (!userDataHash) {
                return res.status(404).json({ error: "Data hash not found for the user" });
            }
            // Update the data hash and file information
            userDataHash.dataHash = newDataHash;
            userDataHash.filename = file.originalname; // Update file name if necessary
            userDataHash.encryptedSecret = secretKey;
            await userDataHash.save();
            res.json({ txHash, newCid });
        }
        catch (error) {
            console.error("Error in updateData:", error.message);
            res.status(500).json({ error: error.message });
        }
    }
    static async deleteData(req, res) {
        try {
            const { cid, username } = req.body;
            // Find the user by username
            const user = await User_1.User.findOne({ where: { username } });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            const userDataHash = await UserDataHash_1.UserDataHash.findOne({ where: { user, dataHash: cid } });
            if (!userDataHash) {
                return res.status(404).json({ error: "Data hash not found for the user" });
            }
            // Remove the reference to the CID
            const nullHash = ipfsService_1.IpfsService.hashData("");
            const txHash = await zkSyncService.deleteData(nullHash);
            // Remove the data from the database
            await userDataHash.remove();
            res.json({ txHash });
        }
        catch (error) {
            console.error("Error in deleteData:", error.message);
            res.status(500).json({ error: error.message });
        }
    }
    // Grant access to another user
    static async grantAccess(req, res) {
        try {
            const { userAddress } = req.body;
            const txHash = await zkSyncService.grantAccess(userAddress);
            res.json({ txHash });
        }
        catch (error) {
            console.error("Error in grantAccess:", error.message);
            res.status(500).json({ error: error.message });
        }
    }
    // Revoke access from a user
    static async revokeAccess(req, res) {
        try {
            const { userAddress } = req.body;
            const txHash = await zkSyncService.revokeAccess(userAddress);
            res.json({ txHash });
        }
        catch (error) {
            console.error("Error in revokeAccess:", error.message);
            res.status(500).json({ error: error.message });
        }
    }
    static async getUserDetails(req, res) {
        var _a;
        try {
            const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
            if (!token) {
                return res.status(401).json({ error: "No token provided" });
            }
            // Verify and get userId from token
            const decoded = authService_1.AuthService.verifyToken(token);
            const user = await User_1.User.findOne({ where: { id: decoded.userId }, relations: ["dataHashes"] });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            // Return user details (excluding sensitive information like password hash)
            res.json({
                id: user.id,
                username: user.username,
                isActive: user.isActive,
                dataHashes: user.dataHashes
            });
        }
        catch (error) {
            console.error("Error fetching user details:", error.message);
            res.status(500).json({ error: error.message });
        }
    }
    // Fetch all data hashes for the user by token
    static async getUserDataHashes(req, res) {
        var _a;
        try {
            const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
            if (!token) {
                return res.status(401).json({ error: "No token provided" });
            }
            // Verify and get userId from token
            const decoded = authService_1.AuthService.verifyToken(token);
            const user = await User_1.User.findOne({ where: { id: decoded.userId }, relations: ["dataHashes"] });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            // Return only the data hashes for the user
            res.json({ dataHashes: user.dataHashes });
        }
        catch (error) {
            console.error("Error fetching user data hashes:", error.message);
            res.status(500).json({ error: error.message });
        }
    }
}
exports.DataController = DataController;
