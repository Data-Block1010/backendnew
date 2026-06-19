// src/config/email.config.ts
import nodemailer from 'nodemailer';

interface EmailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  service?: string;
  auth: {
    user: string;
    pass: string;
  };
  connectionTimeout: number;
  greetingTimeout: number;
  socketTimeout: number;
}

// Email configuration
export const emailConfig: EmailConfig = {
  // For Gmail
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASSWORD || '',
  },
  // Fail fast instead of hanging for minutes when SMTP is unreachable or
  // misconfigured (e.g. missing credentials in a given environment).
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 10_000,

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
export const transporter = nodemailer.createTransport(emailConfig);