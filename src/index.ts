// src/app.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { SecretKeyService } from './services/secretKeyService';
import dbConnect from './db'; 
import express from 'express';
import multer from 'multer';
import Web3 from "web3";
import mongoose from 'mongoose';
import cors from 'cors'; 
import helmet from 'helmet'; 
import { generateProof } from './services/proofService';
import { verifyProofOnChain, verifyProofOffChain } from './services/verifyProofService';
import { DataController } from './controllers/dataController';
import { authenticate } from './middleware/authMiddleware';
import { AuthService } from './services/authService';
import { setupSwagger } from './swaggerConfig';
import StringNumberService from '../src/services/str_numService';
// import { User } from './entitiy/User';
// import { UserDataHash } from './entitiy/UserDataHash';
import ProofController from './controllers/proofController'; 
import { ZkSyncService } from "./services/zkSyncService";
import KYC from './models/KYC'; // Import the KYC model
import User from './models/User';
import Proof from './models/proof'; // Import the User model
import UserDataHash from './models/UserDataHash'; // Import the UserDataHash model
import { KYCController } from './controllers/kycController'; // Import the KYC controller
const web3 = new Web3(process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia-api.lisk.com");


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
dbConnect();
// Create a new instance of DataSource
const AppDataSource = new DataSource({
    type: 'sqlite',
    database: 'database.sqlite',
    entities: [User, UserDataHash], // Ensure both entities are here
    synchronize: true,
    logging: false,
});

// Initialize the connection
AppDataSource.initialize()
    .then(async () => {
        const app = express();
          // Add security headers using helmet
          app.use(helmet());

          // Enable CORS for all routes
          const corsOptions = {
            origin: [
                'http://localhost:3000', 
                'https://backendnew-4hei.onrender.com/', 
                'https://secure-data.on-fleek.app', 
                'https://securedata.on-fleek.app',
                'https://sd-svc.onrender.com',
                'https://sd-svc.vercel.app'
            ],
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true, // Allow credentials (cookies, authorization headers, etc.)
        };
        
        app.use(cors(corsOptions)); // Apply CORS options
        
  
          
        app.use(express.json());

        setupSwagger(app); // Setup Swagger

        // Register API
        /**
         * @swagger
         * /register:
         *   post:
         *     summary: Register a new user
         *     tags: [Auth]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required:
         *               - username
         *               - password
         *             properties:
         *               username:
         *                 type: string
         *                 example: "user123"
         *               password:
         *                 type: string
         *                 example: "strongpassword"
         *     responses:
         *       201:
         *         description: User registered successfully
         *       500:
         *         description: Server error
         */
        app.post('/register', async (req, res) => {
            try {
                const { username, password } = req.body;
                await AuthService.register(username, password);
                res.status(201).json({ message: 'User registered' });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
                res.status(500).json({ error: errorMessage });
            }
        });

        // Login API
        /**
         * @swagger
         * /login:
         *   post:
         *     summary: Log in a user
         *     tags: [Auth]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required:
         *               - username
         *               - password
         *             properties:
         *               username:
         *                 type: string
         *                 example: "user123"
         *               password:
         *                 type: string
         *                 example: "strongpassword"
         *     responses:
         *       200:
         *         description: Successful login
         *       401:
         *         description: Invalid credentials
         */
        app.post('/login', async (req, res) => {
            try {
                const { username, password } = req.body;
                const token = await AuthService.login(username, password);
                res.json({ token });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
                res.status(401).json({ error: errorMessage });
            }
        });


/**
 * @swagger
 * /generate-proof:
 *   post:
 *     summary: Generate a cryptographic proof
 *     tags: [Proofs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - secretKey
 *               - circuitWasmPath
 *               - zkeyPath
 *               - filename  
 *             properties:
 *               username:
 *                 type: string
 *                 description: The username of the user requesting the proof
 *                 example: "user123"
 *               secretKey:
 *                 type: string
 *                 description: The secret key for encryption
 *                 example: "your_secret_key"
 *               circuitWasmPath:
 *                 type: string
 *                 description: The path to the circuit WASM file
 *                 example: "path/to/circuit.wasm"
 *               zkeyPath:
 *                 type: string
 *                 description: The path to the Zkey file
 *                 example: "path/to/verification.zkey"
 *               filename:  
 *                 type: string
 *                 description: The name of the file to find the corresponding data hash
 *                 example: "example_file.txt"
 *     responses:
 *       200:
 *         description: Proof generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 proof:
 *                   type: object
 *                   description: The generated cryptographic proof
 *                 publicSignals:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: The public signals generated with the proof
 *       500:
 *         description: Server error
 */
app.post('/generate-proof', authenticate, async (req:any, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
          }
        const userId = req.user; // Get the user ID from the request
        //const { username, secretKey, circuitWasmPath, zkeyPath, filename } = req.body;

        // Fetch the user's KYC details
        const kycDetails = await KYC.findOne({ user: userId });
        if (!kycDetails) {
            return res.status(404).json({ error: 'KYC details not found for the user' });
        }

        // Construct the inputData from KYC details
        req.body.inputData = {
            dateOfBirth: new Date(kycDetails.dateOfBirth).getTime(), // Convert to timestamp
            currentDate: Date.now(), // Current timestamp
            name: StringNumberService.stringToNumber(kycDetails.name), // Convert name to BigInt
            idNumber: StringNumberService.stringToNumber(kycDetails.idNumber), // Convert ID number to BigInt
            nationality: StringNumberService.stringToNumber(kycDetails.nationality), // Convert nationality to BigInt
            expectedName: StringNumberService.stringToNumber(kycDetails.name), // Convert expected name to BigInt
            expectedIDNumber: StringNumberService.stringToNumber(kycDetails.idNumber), // Convert expected ID number to BigInt
            expectedNationality: StringNumberService.stringToNumber(kycDetails.nationality), // Convert expected nationality to BigInt
            kycVerified: kycDetails.kycVerified,
            // Additional parameters can be added here if needed
        };

        console.log("Updated request body with input data:", req.body);

        // Call the method to generate proof with the updated request body
        await DataController.generateUserProof(req, res);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error in /generate-proof:";
        console.error("Error occurred:", errorMessage); // Log the error message
        res.status(500).json({ error: "Internal server error" });
    }
});

        // Verify Proof API
/**
 * @swagger
 * /verify-proof:
 *   post:
 *     summary: Verify a cryptographic proof
 *     tags: [Proofs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - proofId
 *               - verificationKeyPath
 *               - verifierAddress
 *             properties:
 *               username:
 *                 type: string
 *                 description: The username of the user whose proof is being verified
 *               proofId:
 *                 type: string
 *                 description: The ID of the proof to verify
 *               verificationKeyPath:
 *                 type: string
 *                 description: Path to the verification key file
 *               verifierAddress:
 *                  type: string
 *                  description: address of the verifier contract
 *     responses:
 *       200:
 *         description: Proof verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 validOffChain:
 *                   type: boolean
 *                   description: Indicates whether the proof is valid off-chain
 *                 validOnChain:
 *                   type: string
 *                   description: Indicates whether the proof is valid on-chain (if applicable)
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message detailing what went wrong
 *       404:
 *         description: Proof or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message when proof or user is not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message for server-side issues
 */

app.post('/verify-proof', authenticate, async (req:any, res) => {
    try {
        const { username, proofId, verificationKeyPath, verifierAddress } = req.body;
        const userId = req.user; // Assuming the userId is available from authentication middleware
        console.log('Proof ID:', proofId);

        // Validate required fields
        if (!username || !proofId || !verificationKeyPath || !verifierAddress) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const proof_id = new mongoose.Types.ObjectId(`${proofId}`);
        const formattedProofId = `ObjectId('${proof_id.toHexString()}')`;
        console.log("proof is", proof_id, formattedProofId);

        // Fetch the proof associated with the specific user and proofId
        const proofRecord = await Proof.findOne({ _id: proof_id });
        
        if (!proofRecord) {
            return res.status(404).json({ error: 'Proof not found for the specified user' });
        }

        const { proofData, publicSignals } = proofRecord;

        // Off-chain verification
        const isValidOffChain = await verifyProofOffChain(proofData, publicSignals, verificationKeyPath);

        // On-chain verification
        let isValidOnChain = false;
        try {
            isValidOnChain = await verifyProofOnChain(proofData, publicSignals, verifierAddress);
        } catch (err) {
            console.error('On-chain verification failed:', err);
        }

        res.json({ validOffChain: isValidOffChain, validOnChain: isValidOnChain });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        console.error('Error in /verify-proof:', errorMessage);
        res.status(500).json({ error: errorMessage });
    }
});

/**
 * @swagger
 * /api/proofs:
 *   get:
 *     summary: Get all proofs for the user
 *     description: Retrieves all proofs associated with the authenticated user.
 *     tags: [Proofs]
 *     responses:
 *       200:
 *         description: List of proofs retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       404:
 *         description: No proofs found for the user.
 *       500:
 *         description: Internal server error.
 */
app.get('/api/proofs', authenticate, ProofController.getAll);

/**
 * @swagger
 * /api/proofs/{proofId}:
 *   get:
 *     summary: Get proof by ID
 *     description: Retrieves a proof by its ID.
 *     tags: [Proofs]
 *     parameters:
 *       - in: path
 *         name: proofId
 *         required: true
 *         description: The ID of the proof to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Proof retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Proof not found.
 *       500:
 *         description: Internal server error.
 */
app.get('/api/proofs/:proofId', authenticate, ProofController.getById);

/**
 * @swagger
 * /api/proofs/{proofId}:
 *   put:
 *     summary: Update proof by ID
 *     description: Updates a proof with the specified ID.
 *     tags: [Proofs]
 *     parameters:
 *       - in: path
 *         name: proofId
 *         required: true
 *         description: The ID of the proof to update.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Proof updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Proof not found.
 *       500:
 *         description: Internal server error.
 */
app.put('/api/proofs/:proofId', authenticate, ProofController.update);

/**
 * @swagger
 * /api/proofs/{proofId}:
 *   delete:
 *     summary: Delete proof by ID
 *     description: Deletes a proof with the specified ID.
 *     tags: [Proofs]
 *     parameters:
 *       - in: path
 *         name: proofId
 *         required: true
 *         description: The ID of the proof to delete.
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Proof deleted successfully.
 *       404:
 *         description: Proof not found.
 *       500:
 *         description: Internal server error.
 */
app.delete('/api/proofs/:proofId', authenticate, ProofController.delete);

        // Store Data API with File Upload and Secret Key
        /**
         * @swagger
         * /store-data:
         *   post:
         *     summary: Store data with a file upload and secret key
         *     tags: [Data Management]
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         multipart/form-data:
         *           schema:
         *             type: object
         *             properties:
         *               file:
         *                 type: string
         *                 format: binary
         *                 description: The file to store
         *               secretKey:
         *                 type: string
         *                 description: The secret key for encryption
         *     responses:
         *       200:
         *         description: Data stored successfully
         *       401:
         *         description: Unauthorized
         *       500:
         *         description: Server error
         */
        app.post('/store-data', upload.single('file'), authenticate, DataController.storeData);
        // View Data API
    /**
     * @swagger
     * /view-data:
     *   post:
     *     summary: View data for a user
     *     tags: [Data Management]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - ownerAddress
     *               - dataHash
     *               - secretKey
     *             properties:
     *               ownerAddress:
     *                 type: string
     *                 description: The owner's address for the data
     *               dataHash:
     *                 type: string
     *                 description: The data hash (CID) of the stored file
     *               secretKey:
     *                 type: string
     *                 description: The secret key for decryption
     *     responses:
     *       200:
     *         description: Data retrieved and decrypted successfully
     *       404:
     *         description: Data not found
     *       500:
     *         description: Server error
     */
    app.post('/view-data', authenticate, DataController.viewData); // This adds the view-data endpoint

        // Add /submit-transaction endpoint
        /**
         * @swagger
         * /submit-transaction:
         *   post:
         *     summary: Submit a signed transaction
         *     tags: [Blockchain]
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               signedTx:
         *                 type: string
         *                 description: The signed transaction data
         *     responses:
         *       200:
         *         description: Transaction submitted successfully
         *       400:
         *         description: Bad request, missing signed transaction
         *       500:
         *         description: Server error
         */
        app.post('/submit-transaction', authenticate, async (req, res) => {
            try {
                const { signedTx } = req.body;

                if (!signedTx) {
                    return res.status(400).json({ error: 'Signed transaction is required' });
                }

                const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
                console.log("Transaction receipt:", receipt);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
                res.status(500).json({ error: errorMessage });
            }
        });
        // Endpoint to get user details
/**
 * @swagger
 * /user-details:
 *   get:
 *     summary: Get the details of the logged-in user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The ID of the user, extracted from the token
 *                   example: "7bda62e1-5f95-4a11-8b4f-52f536120c35"
 *                 username:
 *                   type: string
 *                   description: The username of the user
 *                   example: "user123"
 *                 isActive:
 *                   type: boolean
 *                   description: Indicates whether the user is active
 *                   example: true
 *       401:
 *         description: Unauthorized - Token is invalid or missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: "No token provided"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: "Failed to fetch user details"
 */

        app.get('/user-details', authenticate, async (req, res) => {
            try {
                //console.log(req)
                const { userId } = req.body;
                const user = await User.findOne({ where: { id: userId } });
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
                res.json({ id: user.id, username: user.username, isActive: user.isActive });
            } catch (error) {
                res.status(500).json({ error: 'Failed to fetch user details' });
            }
        });

       // Endpoint to get user data hashes
/**
 * @swagger
 * /user-data-hashes:
 *   get:
 *     summary: Get all data hashes of the logged-in user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data hashes fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   dataHash:
 *                     type: string
 *                     description: The hash of the stored data
 *                     example: "QmT5NvUtoM5n6JK3G3XsjFktkRjaQ2eD72erRbxAho99rT"
 *                   filename:
 *                     type: string
 *                     description: The name of the uploaded file
 *                     example: "document.pdf"
 *                   encryptedSecret:
 *                     type: string
 *                     description: The encrypted secret used for data decryption
 *                     example: "AES-128-CBC"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: The timestamp when the data was stored
 *                     example: "2023-09-04T14:23:45Z"
 *       401:
 *         description: Unauthorized - Token is invalid or missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: "No token provided"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: "Failed to fetch user data hashes"
 */

        app.get('/user-data-hashes', authenticate, async (req:any, res) => {
            try {
                //console.log(req)
                const  userId = req.user;
                const userDataHashes = await UserDataHash.find({ user:  userId  });
                res.json(userDataHashes.map(data => ({
                    dataHash: data.dataHash,
                    filename: data.filename,
                    encryptedSecret: data.encryptedSecret,
                    createdAt: data.createdAt
                })));
            } catch (error) {
                res.status(500).json({ error: 'Failed to fetch user data hashes' });
            }
        });



       // Update Data API with File Upload and Secret Key
    /**
     * @swagger
     * /update-data:
     *   post:
     *     summary: Update data with a file upload, secret key, ownerAddress, and username
     *     tags: [Data Management]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               file:
     *                 type: string
     *                 format: binary
     *                 description: The new file to update
     *               secretKey:
     *                 type: string
     *                 description: The secret key for encryption
     *      
     *               username:
     *                 type: string
     *                 description: The username of the data owner
     *               cid:
     *                 type: string
     *                 description: The CID of the data to update
     *     responses:
     *       200:
     *         description: Data updated successfully
     *       404:
     *         description: Data not found
     *       500:
     *         description: Server error
     */
    app.post('/update-data', upload.single('file'), authenticate, DataController.updateData); 


        // Delete Data API
        /**
         * @swagger
         * /delete-data:
         *   post:
         *     summary: Delete data
         *     tags: [Data Management]
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               cid:
         *                 type: string
         *                 description: The CID of the data to delete
         *     responses:
         *       200:
         *         description: Data deleted successfully
         *       401:
         *         description: Unauthorized
         *       500:
         *         description: Server error
         */
        app.post('/delete-data', authenticate, DataController.deleteData);

      /**
 * @swagger
 * /grant-access:
 *   post:
 *     summary: Grant access to data
 *     tags: [Access Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userAddress
 *             properties:
 *               userAddress:
 *                 type: string
 *                 description: The address of the user to grant access
 *     responses:
 *       200:
 *         description: Access granted successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
app.post('/grant-access', authenticate, DataController.grantAccess);

       

       /**
 * @swagger
 * /revoke-access:
 *   post:
 *     summary: Revoke access to data
 *     tags: [Access Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userAddress
 *             properties:
 *               userAddress:
 *                 type: string
 *                 description: The address of the user to revoke access from
 *     responses:
 *       200:
 *         description: Access revoked successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
app.post('/revoke-access', authenticate, DataController.revokeAccess);


        // Secret Key Generation API
        /**
         * @swagger
         * /generate-key:
         *   get:
         *     summary: Generate a secure secret key
         *     tags: [Key Management]
         *     responses:
         *       200:
         *         description: Secret key generated successfully
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 secretKey:
         *                   type: string
         *                   description: Generated secret key
         *       500:
         *         description: Server error
         */
        app.get('/generate-key', (req, res) => {
            try {
                const secretKey = SecretKeyService.generateSecretKey();
                res.json({ secretKey });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
                res.status(500).json({ error: errorMessage });
            }
        });
// KYC Creation API
/**
 * @swagger
 * /kyc:
 *   post:
 *     summary: Create a new KYC record
 *     tags: [KYC]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - dateOfBirth
 *               - idNumber
 *               - nationality
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-01"
 *               idNumber:
 *                 type: string
 *                 example: "A12345678"
 *               nationality:
 *                 type: string
 *                 example: "USA"
 *     responses:
 *       201:
 *         description: KYC record created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
app.post('/kyc', authenticate, KYCController.createKYC); // Use the KYC controller to handle the request
/**
 * @swagger
 * /kyc/user:
 *   get:
 *     summary: Get all KYC records for the logged-in user
 *     tags: [KYC]
 *     responses:
 *       200:
 *         description: List of KYC records for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   dateOfBirth:
 *                     type: string
 *                     format: date
 *                   idNumber:
 *                     type: string
 *                   nationality:
 *                     type: string
 *               example:
 *                 - _id: "616d5d4edb2c5b0015e9f4b6"
 *                   name: "John Doe"
 *                   dateOfBirth: "1990-01-01"
 *                   idNumber: "A12345678"
 *                   nationality: "USA"
 *       400:
 *         description: User ID is required
 *       500:
 *         description: Error retrieving KYC records
 */
app.get('/kyc/user', authenticate, KYCController.getAllKYCForUser);
 
/**
 * @swagger
 * /kyc/{id}:
 *   get:
 *     summary: Get KYC record by ID
 *     tags: [KYC]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The KYC record ID
 *     responses:
 *       200:
 *         description: KYC record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 dateOfBirth:
 *                   type: string
 *                 idNumber:
 *                   type: string
 *                 nationality:
 *                   type: string
 *               example:
 *                 _id: "616d5d4edb2c5b0015e9f4b6"
 *                 name: "John Doe"
 *                 dateOfBirth: "1990-01-01"
 *                 idNumber: "A12345678"
 *                 nationality: "USA"
 *       404:
 *         description: KYC record not found
 *       500:
 *         description: Server error
 */
app.get('/kyc/:id', authenticate, KYCController.getKYCById);
// Update KYC API
/**
 * @swagger
 * /kyc/{id}:
 *   patch:
 *     summary: Update KYC record
 *     tags: [KYC]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The KYC record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               idNumber:
 *                 type: string
 *               nationality:
 *                 type: string
 *     responses:
 *       200:
 *         description: KYC record updated successfully
 *       404:
 *         description: KYC record not found
 *       500:
 *         description: Server error
 */
app.patch('/kyc/:id', authenticate, KYCController.updateKYC);
// Delete KYC API
/**
 * @swagger
 * /kyc/{id}:
 *   delete:
 *     summary: Delete KYC record
 *     tags: [KYC]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The KYC record ID
 *     responses:
 *       200:
 *         description: KYC record deleted successfully
 *       404:
 *         description: KYC record not found
 *       500:
 *         description: Server error
 */
app.delete('/kyc/:id', authenticate, KYCController.deleteKYC);
      
//         // Dummy Data Endpoint for Verification
//         /**
//          * @swagger
//          * /api/kyc/verify_user:
//          *   get:
//          *     summary: Get dummy user data for verification
//          *     tags: [KYC]
//          *     responses:
//          *       200:
//          *         description: Dummy user data retrieved successfully
//          *         content:
//          *           application/json:
//          *             schema:
//          *               type: object
//          *               properties:
//          *                 userId:
//          *                   type: string
//          *                   example: "12345"
//          *                 fullName:
//          *                   type: string
//          *                   example: "John Doe"
//          *                 email:
//          *                   type: string
//          *                   example: "john.doe@example.com"
//          *                 phoneNumber:
//          *                   type: string
//          *                   example: "+1234567890"
//          *                 dateOfBirth:
//          *                   type: string
//          *                   example: "1990-01-01"
//          *                 address:
//          *                   type: object
//          *                   properties:
//          *                     street:
//          *                       type: string
//          *                       example: "123 Main St"
//          *                     city:
//          *                       type: string
//          *                       example: "Anytown"
//          *                     state:
//          *                       type: string
//          *                       example: "CA"
//          *                     postalCode:
//          *                       type: string
//          *                       example: "12345"
//          *                     country:
//          *                       type: string
//          *                       example: "USA"
//          *                 documents:
//          *                   type: array
//          *                   items:
//          *                     type: object
//          *                     properties:
//          *                       documentType:
//          *                         type: string
//          *                         example: "passport"
//          *                       documentNumber:
//          *                         type: string
//          *                         example: "A12345678"
//          *                       issueDate:
//          *                         type: string
//          *                         example: "2015-01-01"
//          *                       expiryDate:
//          *                         type: string
//          *                         example: "2025-01-01"
//          */
//         app.get('/api/kyc/verify_user', (req, res) => {
//             const dummyUserData = {
//                 userId: "12345",
//                 fullName: "John Doe",
//                 email: "john.doe@example.com",
//                 phoneNumber: "+1234567890",
//                 dateOfBirth: "1990-01-01",
//                 address: {
//                     street: "123 Main St",
//                     city: "Anytown",
//                     state: "CA",
//                     postalCode: "12345",
//                     country: "USA"
//                 },
//                 documents: [
//                     {
//                         documentType: "passport",
//                         documentNumber: "A12345678",
//                         issueDate: "2015-01-01",
//                         expiryDate: "2025-01-01"
//                     }
//                 ]
//             };
//             res.json(dummyUserData);
//         });
// /**
//  * @swagger
//  * /api/kyc/verify_user:
//  *   post:  // Change from 'get' to 'post'
//  *     summary: Verify user data for KYC
//  *     tags: [KYC]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               userId:
//  *                 type: string
//  *                 example: "12345"
//  *               fullName:
//  *                 type: string
//  *                 example: "John Doe"
//  *               email:
//  *                 type: string
//  *                 example: "john.doe@example.com"
//  *               phoneNumber:
//  *                 type: string
//  *                 example: "+1234567890"
//  *               dateOfBirth:
//  *                 type: string
//  *                 example: "1990-01-01"
//  *               address:
//  *                 type: object
//  *                 properties:
//  *                   street:
//  *                     type: string
//  *                     example: "123 Main St"
//  *                   city:
//  *                     type: string
//  *                     example: "Anytown"
//  *                   state:
//  *                     type: string
//  *                     example: "CA"
//  *                   postalCode:
//  *                     type: string
//  *                     example: "12345"
//  *                   country:
//  *                     type: string
//  *                     example: "USA"
//  *               documents:
//  *                 type: array
//  *                 items:
//  *                   type: object
//  *                   properties:
//  *                     documentType:
//  *                       type: string
//  *                       example: "passport"
//  *                     documentNumber:
//  *                       type: string
//  *                       example: "A12345678"
//  *                     issueDate:
//  *                       type: string
//  *                       example: "2015-01-01"
//  *                     expiryDate:
//  *                       type: string
//  *                       example: "2025-01-01"
//  *     responses:
//  *       200:
//  *         description: User data verified successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: "User data verified successfully."
//  *                 userData:
//  *                   type: object
//  *                   properties:
//  *                     userId:
//  *                       type: string
//  *                       example: "12345"
//  *                     fullName:
//  *                       type: string
//  *                       example: "John Doe"
//  *                     email:
//  *                       type: string
//  *                       example: "john.doe@example.com"
//  *                     phoneNumber:
//  *                       type: string
//  *                       example: "+1234567890"
//  *                     dateOfBirth:
//  *                       type: string
//  *                       example: "1990-01-01"
//  *                     address:
//  *                       type: object
//  *                       properties:
//  *                         street:
//  *                           type: string
//  *                           example: "123 Main St"
//  *                         city:
//  *                           type: string
//  *                           example: "Anytown"
//  *                         state:
//  *                           type: string
//  *                           example: "CA"
//  *                         postalCode:
//  *                           type: string
//  *                           example: "12345"
//  *                         country:
//  *                           type: string
//  *                           example: "USA"
//  *                     documents:
//  *                       type: array
//  *                       items:
//  *                         type: object
//  *                         properties:
//  *                           documentType:
//  *                             type: string
//  *                             example: "passport"
//  *                           documentNumber:
//  *                             type: string
//  *                             example: "A12345678"
//  *                           issueDate:
//  *                             type: string
//  *                             example: "2015-01-01"
//  *                           expiryDate:
//  *                             type: string
//  *                             example: "2025-01-01"
//  */
// app.post('/api/kyc/verify_user', (req, res) => {
//     const { userId, fullName, email, phoneNumber, dateOfBirth, address, documents } = req.body;

//     // Basic validation
//     if (!userId || !fullName || !email || !phoneNumber || !dateOfBirth || !address || !documents) {
//         return res.status(400).json({ error: "All fields are required." });
//     }

//     // Here you could add logic to verify the user data

//     // Respond with the received data or a success message
//     const responseData = {
//         userId,
//         fullName,
//         email,
//         phoneNumber,
//         dateOfBirth,
//         address,
//         documents
//     };

//     res.json({
//         message: "User data verified successfully.",
//         userData: responseData
//     });
// });

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    });
    // {
    //     "issuer": "SecureData",
    //     "desc": "A secure platform for identity verification using KYC processes with Zero-Knowledge Proofs.",
    //     "website": "https://backendnew-4hei.onrender.com/api/kyc/verify_user",
    //     "breakWall": true,
    //     "APIs": [
    //       {
    //         "host": "www.backendnew-4hei.onrender.com",
    //         "intercept": {
    //           "url": "api/kyc/verify_user",
    //           "method": "GET",  
    //           "query": [
    //             {
    //               "key": "userId", 
    //               "value": "12345",
    //               "verify": true
    //             }
    //           ]
    //         },
    //         "assert": [
    //           {
    //             "key": "userId",
    //             "value": "12345",
    //             "operation": "="
    //           },
    //           {
    //             "key": "fullName",
    //             "value": "John Doe",
    //             "operation": "="
    //           },
    //           {
    //             "key": "email",
    //             "value": "john.doe@example.com",
    //             "operation": "="
    //           },
    //           {
    //             "key": "phoneNumber",
    //             "value": "+1234567890",
    //             "operation": "="
    //           },
    //           {
    //             "key": "dateOfBirth",
    //             "value": "1990-01-01",
    //             "operation": "="
    //           }
    //         ],
    //         "nullifier": "userId"
    //       }
    //     ],
    //     "HRCondition": [
    //       "User must have completed KYC verification"
    //     ],
    //     "tips": {
    //       "message": "Please ensure that your KYC documents are ready. After logging in, click the 'Start Verification' button to proceed."
    //     }
    //   } 