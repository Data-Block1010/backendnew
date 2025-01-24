"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyController = void 0;
const Company_1 = __importDefault(require("../models/Company"));
const crypto_1 = __importDefault(require("crypto"));
class CompanyController {
    static async signup(req, res) {
        try {
            const { name, website, email, integrationPurpose, maxUsers, projectDescription, logo, walletAddress, businessDocuments, kycRequirements } = req.body;
            // Validate required fields
            if (!name || !website || !email || !integrationPurpose || !maxUsers ||
                !projectDescription || !logo || !walletAddress) {
                return res.status(400).json({
                    error: 'Missing required fields'
                });
            }
            // Check if company exists
            const existingCompany = await Company_1.default.findOne({
                $or: [{ email }, { walletAddress }]
            });
            if (existingCompany) {
                return res.status(409).json({
                    error: 'Company with this email or wallet address already exists'
                });
            }
            // Generate dedicated page URL
            const urlSafeCompanyName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const dedicatedPageUrl = `${process.env.BASE_URL}/companies/${urlSafeCompanyName}`;
            // Create company
            const company = new Company_1.default({
                name,
                website,
                email,
                integrationPurpose,
                maxUsers,
                projectDescription,
                logo,
                walletAddress,
                businessDocuments: businessDocuments || [],
                kycRequirements: kycRequirements || [],
                dedicatedPageUrl,
                apiKey: crypto_1.default.randomBytes(32).toString('hex')
            });
            await company.save();
            return res.status(201).json({
                message: 'Company registered successfully',
                company: {
                    name: company.name,
                    website: company.website,
                    email: company.email,
                    integrationPurpose: company.integrationPurpose,
                    maxUsers: company.maxUsers,
                    projectDescription: company.projectDescription,
                    logo: company.logo,
                    walletAddress: company.walletAddress,
                    dedicatedPageUrl: company.dedicatedPageUrl,
                    status: company.status
                }
            });
        }
        catch (error) {
            console.error('Company signup error:', error);
            return res.status(500).json({
                error: 'Failed to register company'
            });
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
