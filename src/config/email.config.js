"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transporter = exports.emailConfig = void 0;
// src/config/email.config.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
// Email configuration
exports.emailConfig = {
    // For Gmail
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASSWORD || '',
    }
    // For custom SMTP server, uncomment and use these settings instead:
    // host: process.env.SMTP_HOST,
    // port: Number(process.env.SMTP_PORT),
    // secure: true, // true for 465, false for other ports
    // auth: {
    //   user: process.env.SMTP_USER || '',
    //   pass: process.env.SMTP_PASSWORD || ''
    // }
};
// Create transporter
exports.transporter = nodemailer_1.default.createTransport(exports.emailConfig);
