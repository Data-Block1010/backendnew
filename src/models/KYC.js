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
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/KYC.ts
const mongoose_1 = __importStar(require("mongoose"));
// Define the KYC schema
const KYCSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    dateOfBirth: {
        type: Date,
        required: true,
    },
    idNumber: {
        type: String,
        required: true,
        unique: true,
    },
    nationality: {
        type: String,
        required: true,
    },
    kycVerified: {
        type: Boolean,
        default: false,
    },
    walletAddress: {
        type: String,
        unique: true, // Each wallet address should be unique
        index: true // Add index for faster queries
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });
// Method to calculate age
KYCSchema.methods.getAge = function () {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};
// Add static method to find by wallet address
KYCSchema.statics.findByWalletAddress = function (walletAddress) {
    return this.findOne({ walletAddress });
};
// Create a model from the schema
const KYC = mongoose_1.default.model('KYC', KYCSchema);
exports.default = KYC;
