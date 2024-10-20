import { Request, Response } from "express";
import multer from "multer";
import { IpfsService } from "../services/ipfsService";
import { ZkSyncService } from "../services/zkSyncService";
import  UserDataHash  from "../models/UserDataHash"; // Import UserDataHash model
import  User from "../models/User"; // Import User model
import Proof from '../models/proof';
import axios from 'axios';
import * as dotenv from "dotenv";
import { generateProof } from '../services/proofService';
import { AuthService } from "../services/authService";

dotenv.config();

interface MulterRequest extends Request {
    file: Express.Multer.File;
}

const ownerAddress: string = String(process.env.OWNER_ADDRESS);
const upload = multer(); // Initialize multer for handling file uploads
const zkSyncService = new ZkSyncService();

export class DataController {
    static async viewData(req: Request, res: Response) {
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
            const response = await axios.get(fileUrl);
            const encryptedData = response.data;

            // Decrypt the data using the provided secret key
            const decryptedData = IpfsService.decryptData(encryptedData, secretKey);

            res.json({ decryptedData, owner });
        } catch (error: any) {
            console.error("Error in viewData:", error.message);
            res.status(500).json({ error: error.message });
        }
    }

    static async generateUserProof(req: Request, res: Response) {
        try {
            const {inputData } = req.body;
            if (inputData) {
                return res.status(400).json({ error: "Missing required fields" });
            }
            const circuitWasmPath = "kycVerification_js/kycVerification.wasm";
            const zkeyPath = "kycVerification_0001.zkey"
            console.log("Request Body:", req.body);
            const userId = req.user; 

            const user = await User.findOne({ _id: userId }); // Mongoose query to find the user
            if (!user) {
                console.error("User not found for username:", userId);
                return res.status(404).json({ error: "User not found" });
            }

            // const userDataHash = await UserDataHash.findOne({ user: user._id, filename }); // Find the hash in the database
            // if (!userDataHash) {
            //     console.error("User data hash not found for filename:", filename);
            //     return res.status(404).json({ error: "User data hash not found" });
            // }

            // const cid = userDataHash.cid; // Fetch the CID
            // if (!cid) {
            //     console.error("CID not found for filename:", filename);
            //     return res.status(404).json({ error: "CID not found" });
            // }

            // Fetch the encrypted data from IPFS
            // const fileUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
            // const response = await axios.get(fileUrl);
            // const encryptedData = response.data;

            // // Decrypt the data using the secret key
            // const decryptedData = IpfsService.decryptData(encryptedData, secretKey);

            // Generate a cryptographic proof using the decrypted data
            const { proof, publicSignals } = await generateProof(
                inputData,
                circuitWasmPath,
                zkeyPath,
                user._id // Pass user ID for proof generation
            );

            // Save the proof and public signals to MongoDB
            const newProof = new Proof({
                userId: user._id,
                proofData: proof,
                publicSignals: publicSignals,
            });
            await newProof.save();

            // Return the proof and public signals in the response
            res.json({ proof, publicSignals });
        } catch (error: any) {
            console.error("Error in generateUserProof:", error.message);
            console.error("Stack Trace:", error.stack);
            res.status(500).json({ error: error.message });
        }
    }

    static async storeData(req: any, res: Response) {
        try {
        
                if (!req.user) {
                    return res.status(401).json({ message: 'Unauthorized' });
                  }
                const userId = req.user; 
                console.log("message", userId, req)
            const { secretKey } = req.body; // Assuming username is provided
            const file = (req as MulterRequest).file;

            if (!file) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            // Convert the file buffer to a string and encrypt the content
            const fileContent = file.buffer.toString('base64');
            const encryptedContent = IpfsService.encryptData(fileContent, secretKey);

            // Upload encrypted content to IPFS and hash it
            const cid = await IpfsService.uploadFile(Buffer.from(encryptedContent));
            console.log(cid);
            const dataHash = IpfsService.hashData(cid);

            // Store the data hash on the zkSync L2 network
            const txHash = await zkSyncService.storeData(dataHash);
            console.log(txHash);

            // Find the user by username
            const user = await User.findOne({ _id: userId }); // Mongoose query

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            // Store the data hash, filename, cid, and encrypted secret in the database
            const userDataHash = new UserDataHash();
            userDataHash.dataHash = dataHash;
            userDataHash.filename = file.originalname; // Store the file's original name
            userDataHash.cid = cid; // Store the CID
            userDataHash.encryptedSecret = secretKey; // Assuming you store encrypted secrets
            userDataHash.user = user._id; // Store the user's ID
            await userDataHash.save(); // Save the entry in the database

            res.json({ txHash, cid, dataHash, message: "Data stored successfully" });
        } catch (error: any) {
            console.error("Error in storeData:", error.message);
            res.status(500).json({ error: error.message });
        }
    }

    static async updateData(req: Request, res: Response) {
        try {
            const { secretKey, cid, username } = req.body;
            const file = (req as MulterRequest).file;

            if (!file) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            // Convert the file buffer to a string and encrypt the new content
            const fileContent = file.buffer.toString('base64');
            const encryptedContent = IpfsService.encryptData(fileContent, secretKey);

            // Upload the new encrypted content to IPFS and hash it
            const newCid = await IpfsService.uploadFile(Buffer.from(encryptedContent));
            const newDataHash = IpfsService.hashData(newCid);

            // Fetch all data records from the blockchain using the getAllData method
            const dataRecords = await zkSyncService.getAllData(ownerAddress);
            console.log(dataRecords)

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

            // Find the user by username
            const user = await User.findOne({ username }); // Mongoose query
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            const userDataHash = await UserDataHash.findOne({ user: user._id, dataHash: cid }); // Mongoose query
            if (!userDataHash) {
                return res.status(404).json({ error: "Data hash not found for the user" });
            }

            // Update the data hash and file information
            userDataHash.dataHash = newDataHash;
            userDataHash.filename = file.originalname; // Update file name if necessary
            userDataHash.encryptedSecret = secretKey;
            await userDataHash.save();

            res.json({ txHash, newCid });
        } catch (error: any) {
            console.error("Error in updateData:", error.message);
            res.status(500).json({ error: error.message });
        }
    }

    static async deleteData(req: Request, res: Response) {
        try {
            const { cid } = req.body;
            const userId = req.user; 
            // Find the user by username
            const user = await User.findOne({ _id: userId }); // Mongoose query
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            const userDataHash = await UserDataHash.findOne({ user: user._id, dataHash: cid }); // Mongoose query
            if (!userDataHash) {
                return res.status(404).json({ error: "Data hash not found for the user" });
            }

            // // Remove the reference to the CID
            // const nullHash = IpfsService.hashData("");
            // const txHash = await zkSyncService.deleteData(nullHash);

            // Remove the data from the database
            await UserDataHash.deleteOne({ _id: userDataHash._id });

            res.json({ "message": "deleted successfully" });
        } catch (error: any) {
            console.error("Error in deleteData:", error.message);
            res.status(500).json({ error: error.message });
        }
    }

    // Grant access to another user
    static async grantAccess(req: Request, res: Response) {
        try {
            const { userAddress } = req.body;
            const txHash = await zkSyncService.grantAccess(userAddress);
            res.json({ txHash });
        } catch (error: any) {
            console.error("Error in grantAccess:", error.message);
            res.status(500).json({ error: error.message });
        }
    }

    // Revoke access from a user
    static async revokeAccess(req: Request, res: Response) {
        try {
            const { userAddress } = req.body;
            const txHash = await zkSyncService.revokeAccess(userAddress);
            res.json({ txHash });
        } catch (error: any) {
            console.error("Error in revokeAccess:", error.message);
            res.status(500).json({ error: error.message });
        }
    }

    static async getUserDetails(req: Request, res: Response) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ error: "No token provided" });
            }

            // Verify and get userId from token
            const decoded = AuthService.verifyToken(token);
            const user = await User.findById(decoded.userId).populate("dataHashes"); // Mongoose query
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            // Return user details (excluding sensitive information like password hash)
            res.json({
                id: user._id,
                username: user.username,
                isActive: user.isActive,
                dataHashes: user.dataHashes
            });
        } catch (error: any) {
            console.error("Error fetching user details:", error.message);
            res.status(500).json({ error: error.message });
        }
    }

    // Fetch all data hashes for the user by token
    static async getUserDataHashes(req: Request, res: Response) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ error: "No token provided" });
            }

            // Verify and get userId from token
            const decoded = AuthService.verifyToken(token);
            const user = await User.findById(decoded.userId).populate("dataHashes"); // Mongoose query

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            // Return only the data hashes for the user
            res.json({ dataHashes: user.dataHashes });
        } catch (error: any) {
            console.error("Error fetching user data hashes:", error.message);
            res.status(500).json({ error: error.message });
        }
    }
}