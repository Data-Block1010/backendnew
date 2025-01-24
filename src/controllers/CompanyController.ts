import { Request, Response } from 'express';
import Company from '../models/Company';
import crypto from 'crypto';

export class CompanyController {
   static async signup(req: Request, res: Response) {
       try {
           const {
               name,
               website,
               email,
               integrationPurpose,
               maxUsers,
               projectDescription,
               logo,
               walletAddress,
               businessDocuments,
               kycRequirements
           } = req.body;

           // Validate required fields
           if (!name || !website || !email || !integrationPurpose || !maxUsers || 
               !projectDescription || !logo || !walletAddress) {
               return res.status(400).json({
                   error: 'Missing required fields'
               });
           }

           // Check if company exists
           const existingCompany = await Company.findOne({
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
           const company = new Company({
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
               apiKey: crypto.randomBytes(32).toString('hex')
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

       } catch (error) {
           console.error('Company signup error:', error);
           return res.status(500).json({
               error: 'Failed to register company'
           });
       }
   }

   static async getCompanyByWallet(req: Request, res: Response) {
       try {
           const { walletAddress } = req.params;

           const company = await Company.findOne({ walletAddress });

           if (!company) {
               return res.status(404).json({
                   error: 'Company not found'
               });
           }

           return res.json(company);
       } catch (error) {
           console.error('Get company error:', error);
           return res.status(500).json({
               error: 'Failed to get company details'
           });
       }
   }
}