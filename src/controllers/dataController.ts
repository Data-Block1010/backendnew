import { Request, Response } from "express";
import multer from "multer";
import { IpfsService } from "../services/ipfsService";
import { ZkSyncService } from "../services/zkSyncService";
import { UserDataHash } from "../entitiy/UserDataHash"; // Import UserDataHash entity
import { User } from "../entitiy/User"; // Import User entity
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
            const {  dataHash, secretKey } = req.body;

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

    // Other methods stay the same
    static async generateUserProof(req: Request, res: Response) {
        try {
            const { ownerAddress, secretKey, circuitWasmPath, zkeyPath, dataHash } = req.body;
            const userId = req.body; // Assuming you have user data in the request

            // Fetch the data hash from zkSync L2 network
            const dataRecord = await zkSyncService.getDataByHash(ownerAddress, dataHash);

            // Fetch the encrypted data from IPFS using the data hash (CID)
            const fileUrl = `https://gateway.pinata.cloud/ipfs/${dataRecord}`;
            const response = await axios.get(fileUrl);
            const encryptedData = response.data;

            // Decrypt the data using the provided secret key
            const decryptedData = IpfsService.decryptData(encryptedData, secretKey);

            // Generate a cryptographic proof
            const { proof, publicSignals } = await generateProof(
                decryptedData,
                circuitWasmPath,
                zkeyPath,
                userId
            );

            res.json({ proof, publicSignals });
        } catch (error: any) {
            console.error("Error in generateUserProof:", error.message);
            res.status(500).json({ error: error.message });
        }
    }

    static async storeData(req: Request, res: Response) {
        try {
            const { secretKey, username } = req.body; // Assuming username is provided
            const file = (req as MulterRequest).file;

            if (!file) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            // Convert the file buffer to a string and encrypt the content
            const fileContent = file.buffer.toString('base64');
            const encryptedContent = IpfsService.encryptData(fileContent, secretKey);

            // Upload encrypted content to IPFS and hash it
            const cid = await IpfsService.uploadFile(Buffer.from(encryptedContent));
            const dataHash = IpfsService.hashData(cid);

            // Store the data hash on the zkSync L2 network
            const txHash = await zkSyncService.storeData(dataHash);

            // Find the user by username
            const user = await User.findOne({ where: { username } });

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            // Store the data hash, filename, and encrypted secret in the database
            const userDataHash = new UserDataHash();
            userDataHash.dataHash = dataHash;
            userDataHash.filename = file.originalname; // Store the file's original name
            userDataHash.encryptedSecret = secretKey; // Assuming you store encrypted secrets
            userDataHash.user = user;
            await userDataHash.save(); // Save the entry in the database

            res.json({ txHash, cid, message: "Data stored successfully" });
        } catch (error: any) {
            console.error("Error in storeData:", error.message);
            res.status(500).json({ error: error.message });
        }
    }
    static async updateData(req: Request, res: Response) {
        try {
            const { secretKey, cid, username  } = req.body;
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
    
            // Find the user by ownerAddress and update their stored data hash
            const user = await User.findOne({ where: { username } });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
    
            const userDataHash = await UserDataHash.findOne({ where: { user, dataHash: cid } });
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
            const { cid, username } = req.body;

            // Find the user by username
            const user = await User.findOne({ where: { username } });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            const userDataHash = await UserDataHash.findOne({ where: { user, dataHash: cid } });
            if (!userDataHash) {
                return res.status(404).json({ error: "Data hash not found for the user" });
            }

            // Remove the reference to the CID
            const nullHash = IpfsService.hashData("");
            const txHash = await zkSyncService.deleteData(nullHash);

            // Remove the data from the database
            await userDataHash.remove();

            res.json({ txHash });
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
            const user = await User.findOne({ where: { id: decoded.userId }, relations: ["dataHashes"] });
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
            const user = await User.findOne({ where: { id: decoded.userId }, relations: ["dataHashes"] });

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
