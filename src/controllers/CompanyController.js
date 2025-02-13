"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyController = void 0;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const Company_1 = __importDefault(require("../models/Company"));
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Load environment variables
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
class CompanyController {
    static async signup(data, res) {
        try {
            const { name, website, email, integrationPurpose, maxUsers, projectDescription, walletAddress, logo, businessDocuments } = data;
            // Validate required fields
            if (!name || !website || !email || !integrationPurpose || !maxUsers ||
                !projectDescription || !walletAddress || !logo) {
                return res.status(400).json({ error: "Missing required fields" });
            }
            // Check if company exists
            const existingCompany = await Company_1.default.findOne({
                $or: [{ email }, { walletAddress }]
            });
            if (existingCompany) {
                return res.status(409).json({ error: "Company with this email or wallet address already exists" });
            }
            // Upload logo to IPFS
            let logoIpfsUrl;
            if (logo === null || logo === void 0 ? void 0 : logo.buffer) {
                const base64Logo = logo.buffer.toString("base64");
                logoIpfsUrl = await CompanyController.uploadToPinata(base64Logo);
            }
            else {
                return res.status(500).json({ error: "Invalid logo file" });
            }
            // Upload business documents to IPFS
            const businessDocumentUrls = [];
            if (businessDocuments === null || businessDocuments === void 0 ? void 0 : businessDocuments.length) {
                for (const doc of businessDocuments) {
                    if (doc.buffer) {
                        const base64Doc = doc.buffer.toString("base64");
                        const docUrl = await CompanyController.uploadToPinata(base64Doc);
                        if (docUrl)
                            businessDocumentUrls.push(docUrl);
                    }
                }
            }
            // Create company with IPFS URLs
            const company = new Company_1.default({
                name,
                website,
                email,
                integrationPurpose,
                maxUsers,
                projectDescription,
                logo: logoIpfsUrl,
                walletAddress,
                businessDocuments: businessDocumentUrls,
                kycRequirements: [],
                dedicatedPageUrl: `${process.env.BASE_URL}/companies/${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
                apiKey: crypto_1.default.randomBytes(32).toString("hex"),
            });
            await company.save();
            return res.status(201).json({
                message: "Company registered successfully",
                company: {
                    name: company.name,
                    website: company.website,
                    email: company.email,
                    integrationPurpose: company.integrationPurpose,
                    maxUsers: company.maxUsers,
                    projectDescription: company.projectDescription,
                    logo: company.logo, // Returns IPFS URL
                    walletAddress: company.walletAddress,
                    dedicatedPageUrl: company.dedicatedPageUrl,
                    status: company.status,
                },
            });
        }
        catch (error) {
            console.error("Company signup error:", error);
            return res.status(500).json({ error: "Failed to register company" });
        }
    }
    /**
     * Uploads an image to Pinata (IPFS) and returns the IPFS URL.
     */
    static async uploadToPinata(imageBase64) {
        try {
            if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
                console.error("Pinata API keys are missing.");
                return null;
            }
            const formData = new form_data_1.default();
            const imageBuffer = Buffer.from(imageBase64, "base64");
            formData.append("file", imageBuffer, {
                filename: "company_logo.png",
                contentType: "image/png",
            });
            const response = await axios_1.default.post(PINATA_URL, formData, {
                headers: {
                    "Content-Type": `multipart/form-data; boundary=${formData.getBoundary()}`,
                    pinata_api_key: PINATA_API_KEY,
                    pinata_secret_api_key: PINATA_SECRET_KEY,
                },
            });
            if (response.data && response.data.IpfsHash) {
                return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
            }
            return null;
        }
        catch (error) {
            console.error("Pinata upload error:", error);
            return null;
        }
    }
    static async getCompanyByWallet(req, res) {
        try {
            const { walletAddress } = req.params;
            const company = await Company_1.default.findOne({ walletAddress });
            if (!company) {
                return res.status(404).json({
                    error: 'Company not found'
                });
            }
            return res.json(company);
        }
        catch (error) {
            console.error('Get company error:', error);
            return res.status(500).json({
                error: 'Failed to get company details'
            });
        }
    }
}
exports.CompanyController = CompanyController;
