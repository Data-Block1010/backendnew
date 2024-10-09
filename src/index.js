"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const secretKeyService_1 = require("./services/secretKeyService");
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const web3_1 = __importDefault(require("web3"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const verifyProofService_1 = require("./services/verifyProofService");
const dataController_1 = require("./controllers/dataController");
const authMiddleware_1 = require("./middleware/authMiddleware");
const authService_1 = require("./services/authService");
const swaggerConfig_1 = require("./swaggerConfig");
const User_1 = require("./entitiy/User");
const UserDataHash_1 = require("./entitiy/UserDataHash");
const web3 = new web3_1.default(process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia-api.lisk.com");
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage });
// Create a new instance of DataSource
const AppDataSource = new typeorm_1.DataSource({
    type: 'sqlite',
    database: 'database.sqlite',
    entities: [User_1.User, UserDataHash_1.UserDataHash], // Ensure both entities are here
    synchronize: true,
    logging: false,
});
// Initialize the connection
AppDataSource.initialize()
    .then(async () => {
    const app = (0, express_1.default)();
    // Add security headers using helmet
    app.use((0, helmet_1.default)());
    // Enable CORS for all routes
    const corsOptions = {
        origin: ['http://localhost:3000', 'https://backendnew-4hei.onrender.com/', 'https://secure-data.on-fleek.app'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    };
    app.use((0, cors_1.default)(corsOptions)); // Apply CORS options
    app.use(express_1.default.json());
    (0, swaggerConfig_1.setupSwagger)(app); // Setup Swagger
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
            await authService_1.AuthService.register(username, password);
            res.status(201).json({ message: 'User registered' });
        }
        catch (err) {
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
            const token = await authService_1.AuthService.login(username, password);
            res.json({ token });
        }
        catch (err) {
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
     *               - inputData
     *               - circuitWasmPath
     *               - zkeyPath
     *               - userId
     *             properties:
     *               inputData:
     *                 type: object
     *                 required:
     *                   - value
     *                   - threshold1
     *                   - threshold2
     *                   - operation
     *                 properties:
     *                   value:
     *                     type: integer
     *                     description: The value to check against the thresholds
     *                     default: 10
     *                   threshold1:
     *                     type: integer
     *                     description: The first threshold for comparison
     *                     default: 5
     *                   threshold2:
     *                     type: integer
     *                     description: The second threshold for comparison
     *                     default: 15
     *                   operation:
     *                     type: integer
     *                     description: The operation type (0=greater than, 1=less than, 2=equal, 3=range check)
     *                     default: 3
     *               circuitWasmPath:
     *                 type: string
     *                 description: Path to the circuit's WASM file
     *                 default: "path/to/selective_disclosure.wasm"
     *               zkeyPath:
     *                 type: string
     *                 description: Path to the zkey file
     *                 default: "path/to/verification_key.zkey"
     *               userId:
     *                 type: string
     *                 description: Unique identifier for the user session
     *                 default: "user123"
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
    app.post('/generate-proof', authMiddleware_1.authenticate, async (req, res) => {
        await dataController_1.DataController.generateUserProof(req, res);
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
     *               - proof
     *               - publicSignals
     *               - verifierAddress
     *               - verificationKeyPath
     *             properties:
     *               proof:
     *                 type: object
     *                 description: The cryptographic proof to verify
     *               publicSignals:
     *                 type: array
     *                 items:
     *                   type: string
     *                 description: The public signals generated with the proof
     *               verifierAddress:
     *                 type: string
     *                 description: The Ethereum address of the verifier contract
     *               verificationKeyPath:
     *                 type: string
     *                 description: Path to the verification key file
     *     responses:
     *       200:
     *         description: Proof verification result
     *       500:
     *         description: Server error
     */
    app.post('/verify-proof', async (req, res) => {
        try {
            const { proof, publicSignals, verifierAddress, verificationKeyPath } = req.body;
            // Off-chain verification
            const isValidOffChain = await (0, verifyProofService_1.verifyProofOffChain)(proof, publicSignals, verificationKeyPath);
            // On-chain verification
            const isValidOnChain = await (0, verifyProofService_1.verifyProofOnChain)(proof, publicSignals, verifierAddress);
            res.json({ validOffChain: isValidOffChain, validOnChain: isValidOnChain });
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            res.status(500).json({ error: errorMessage });
        }
    });
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
    app.post('/store-data', upload.single('file'), authMiddleware_1.authenticate, dataController_1.DataController.storeData);
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
    app.post('/view-data', authMiddleware_1.authenticate, dataController_1.DataController.viewData); // This adds the view-data endpoint
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
    app.post('/submit-transaction', authMiddleware_1.authenticate, async (req, res) => {
        try {
            const { signedTx } = req.body;
            if (!signedTx) {
                return res.status(400).json({ error: 'Signed transaction is required' });
            }
            const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            console.log("Transaction receipt:", receipt);
        }
        catch (err) {
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
    app.get('/user-details', authMiddleware_1.authenticate, async (req, res) => {
        try {
            //console.log(req)
            const { userId } = req.body;
            const user = await User_1.User.findOne({ where: { id: userId } });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ id: user.id, username: user.username, isActive: user.isActive });
        }
        catch (error) {
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
    app.get('/user-data-hashes', authMiddleware_1.authenticate, async (req, res) => {
        try {
            //console.log(req)
            const { userId } = req.body;
            const userDataHashes = await UserDataHash_1.UserDataHash.find({ where: { user: { id: userId } } });
            res.json(userDataHashes.map(data => ({
                dataHash: data.dataHash,
                filename: data.filename,
                encryptedSecret: data.encryptedSecret,
                createdAt: data.createdAt
            })));
        }
        catch (error) {
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
    app.post('/update-data', upload.single('file'), authMiddleware_1.authenticate, dataController_1.DataController.updateData);
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
    app.post('/delete-data', authMiddleware_1.authenticate, dataController_1.DataController.deleteData);
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
    app.post('/grant-access', authMiddleware_1.authenticate, dataController_1.DataController.grantAccess);
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
    app.post('/revoke-access', authMiddleware_1.authenticate, dataController_1.DataController.revokeAccess);
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
            const secretKey = secretKeyService_1.SecretKeyService.generateSecretKey();
            res.json({ secretKey });
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            res.status(500).json({ error: errorMessage });
        }
    });
    // Dummy Data Endpoint for Verification
    /**
     * @swagger
     * /api/kyc/verify_user:
     *   get:
     *     summary: Get dummy user data for verification
     *     tags: [KYC]
     *     responses:
     *       200:
     *         description: Dummy user data retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 userId:
     *                   type: string
     *                   example: "12345"
     *                 fullName:
     *                   type: string
     *                   example: "John Doe"
     *                 email:
     *                   type: string
     *                   example: "john.doe@example.com"
     *                 phoneNumber:
     *                   type: string
     *                   example: "+1234567890"
     *                 dateOfBirth:
     *                   type: string
     *                   example: "1990-01-01"
     *                 address:
     *                   type: object
     *                   properties:
     *                     street:
     *                       type: string
     *                       example: "123 Main St"
     *                     city:
     *                       type: string
     *                       example: "Anytown"
     *                     state:
     *                       type: string
     *                       example: "CA"
     *                     postalCode:
     *                       type: string
     *                       example: "12345"
     *                     country:
     *                       type: string
     *                       example: "USA"
     *                 documents:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       documentType:
     *                         type: string
     *                         example: "passport"
     *                       documentNumber:
     *                         type: string
     *                         example: "A12345678"
     *                       issueDate:
     *                         type: string
     *                         example: "2015-01-01"
     *                       expiryDate:
     *                         type: string
     *                         example: "2025-01-01"
     */
    app.get('/api/kyc/verify_user', (req, res) => {
        const dummyUserData = {
            userId: "12345",
            fullName: "John Doe",
            email: "john.doe@example.com",
            phoneNumber: "+1234567890",
            dateOfBirth: "1990-01-01",
            address: {
                street: "123 Main St",
                city: "Anytown",
                state: "CA",
                postalCode: "12345",
                country: "USA"
            },
            documents: [
                {
                    documentType: "passport",
                    documentNumber: "A12345678",
                    issueDate: "2015-01-01",
                    expiryDate: "2025-01-01"
                }
            ]
        };
        res.json(dummyUserData);
    });
    /**
     * @swagger
     * /api/kyc/verify_user:
     *   post:  // Change from 'get' to 'post'
     *     summary: Verify user data for KYC
     *     tags: [KYC]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               userId:
     *                 type: string
     *                 example: "12345"
     *               fullName:
     *                 type: string
     *                 example: "John Doe"
     *               email:
     *                 type: string
     *                 example: "john.doe@example.com"
     *               phoneNumber:
     *                 type: string
     *                 example: "+1234567890"
     *               dateOfBirth:
     *                 type: string
     *                 example: "1990-01-01"
     *               address:
     *                 type: object
     *                 properties:
     *                   street:
     *                     type: string
     *                     example: "123 Main St"
     *                   city:
     *                     type: string
     *                     example: "Anytown"
     *                   state:
     *                     type: string
     *                     example: "CA"
     *                   postalCode:
     *                     type: string
     *                     example: "12345"
     *                   country:
     *                     type: string
     *                     example: "USA"
     *               documents:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     documentType:
     *                       type: string
     *                       example: "passport"
     *                     documentNumber:
     *                       type: string
     *                       example: "A12345678"
     *                     issueDate:
     *                       type: string
     *                       example: "2015-01-01"
     *                     expiryDate:
     *                       type: string
     *                       example: "2025-01-01"
     *     responses:
     *       200:
     *         description: User data verified successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "User data verified successfully."
     *                 userData:
     *                   type: object
     *                   properties:
     *                     userId:
     *                       type: string
     *                       example: "12345"
     *                     fullName:
     *                       type: string
     *                       example: "John Doe"
     *                     email:
     *                       type: string
     *                       example: "john.doe@example.com"
     *                     phoneNumber:
     *                       type: string
     *                       example: "+1234567890"
     *                     dateOfBirth:
     *                       type: string
     *                       example: "1990-01-01"
     *                     address:
     *                       type: object
     *                       properties:
     *                         street:
     *                           type: string
     *                           example: "123 Main St"
     *                         city:
     *                           type: string
     *                           example: "Anytown"
     *                         state:
     *                           type: string
     *                           example: "CA"
     *                         postalCode:
     *                           type: string
     *                           example: "12345"
     *                         country:
     *                           type: string
     *                           example: "USA"
     *                     documents:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           documentType:
     *                             type: string
     *                             example: "passport"
     *                           documentNumber:
     *                             type: string
     *                             example: "A12345678"
     *                           issueDate:
     *                             type: string
     *                             example: "2015-01-01"
     *                           expiryDate:
     *                             type: string
     *                             example: "2025-01-01"
     */
    app.post('/api/kyc/verify_user', (req, res) => {
        const { userId, fullName, email, phoneNumber, dateOfBirth, address, documents } = req.body;
        // Basic validation
        if (!userId || !fullName || !email || !phoneNumber || !dateOfBirth || !address || !documents) {
            return res.status(400).json({ error: "All fields are required." });
        }
        // Here you could add logic to verify the user data
        // Respond with the received data or a success message
        const responseData = {
            userId,
            fullName,
            email,
            phoneNumber,
            dateOfBirth,
            address,
            documents
        };
        res.json({
            message: "User data verified successfully.",
            userData: responseData
        });
    });
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
