"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const email_config_1 = require("../config/email.config");
class EmailService {
    constructor() {
        this.appName = 'GuardZero';
        this.primaryColor = '#4F46E5'; // Indigo color, you can adjust
        this.brandFooter = `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
      <p style="color: #666; font-size: 12px;">
        © ${new Date().getFullYear()} ${this.appName}. All rights reserved.<br>
        If you didn't sign up for ${this.appName}, please ignore this email.
      </p>
    </div>
  `;
    }
    async sendEmail(to, subject, html) {
        try {
            await email_config_1.transporter.sendMail({
                from: `"${this.appName}" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                html
            });
            console.log('Email sent successfully to:', to);
        }
        catch (error) {
            console.error('Error sending email:', error);
            if (error instanceof Error) {
                const emailError = error;
                if (emailError.code === 'ECONNREFUSED') {
                    throw new Error('Failed to connect to email server. Please check your configuration.');
                }
                if (emailError.code === 'EAUTH') {
                    throw new Error('Email authentication failed. Please check your credentials.');
                }
                throw new Error(`Failed to send email: ${emailError.message}`);
            }
            throw new Error('An unknown error occurred while sending email');
        }
    }
    async sendDemoRequestConfirmation(to, name, company, message) {
        const subject = `Demo Request Received - ${this.appName}`;
        const formattedDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const html = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${this.primaryColor}; margin: 0; font-size: 28px;">${this.appName}</h1>
          <p style="color: #666; font-size: 16px;">Demo Request Confirmation</p>
        </div>

        <!-- Main Content -->
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Thank you for your interest, ${name}! 🚀</h2>
          
          <p style="font-size: 16px; line-height: 1.5;">
            We've received your demo request for ${this.appName}. Our team is excited to show you how we can help secure and manage your organization's sensitive data.
          </p>

          <!-- Status Card -->
          <div style="background-color: #f8f9ff; border: 1px solid ${this.primaryColor}; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
            <p style="font-size: 14px; color: #666; margin: 0;">Request Status</p>
            <h2 style="color: ${this.primaryColor}; font-size: 24px; margin: 10px 0;">Under Review</h2>
          </div>

          <!-- Request Details -->
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0; font-size: 18px;">Request Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Name:</td>
                <td style="padding: 8px 0; text-align: right;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Company:</td>
                <td style="padding: 8px 0; text-align: right;">${company}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Email:</td>
                <td style="padding: 8px 0; text-align: right;">${to}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Date Submitted:</td>
                <td style="padding: 8px 0; text-align: right;">${formattedDate}</td>
              </tr>
              ${message ? `
              <tr>
                <td style="padding: 8px 0; color: #666;">Message:</td>
                <td style="padding: 8px 0; text-align: right; font-style: italic;">${message}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <!-- Next Steps -->
          <div style="margin: 30px 0;">
            <h3 style="color: #333; font-size: 18px;">What's Next?</h3>
            <ul style="list-style-type: none; padding: 0; margin: 0;">
              <li style="padding: 8px 0; display: flex; align-items: center;">
                <span style="color: ${this.primaryColor}; margin-right: 10px;">✓</span>
                Our team will review your request within 1 business day
              </li>
              <li style="padding: 8px 0; display: flex; align-items: center;">
                <span style="color: ${this.primaryColor}; margin-right: 10px;">✓</span>
                You'll receive a calendar invite for a personalized demo
              </li>
              <li style="padding: 8px 0; display: flex; align-items: center;">
                <span style="color: ${this.primaryColor}; margin-right: 10px;">✓</span>
                We'll prepare a custom demo environment for your needs
              </li>
            </ul>
          </div>

          <p style="font-size: 16px; line-height: 1.5;">
            In the meantime, you can explore our documentation and resources to learn more about our security features and capabilities.
          </p>

          <!-- CTA Buttons -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL}/docs" 
               style="background-color: ${this.primaryColor}; 
                      color: white; 
                      padding: 12px 25px; 
                      text-decoration: none; 
                      border-radius: 6px; 
                      font-weight: bold;
                      display: inline-block;
                      margin: 0 10px;">
              View Documentation
            </a>
            <a href="${process.env.APP_URL}/resources" 
               style="background-color: white; 
                      color: ${this.primaryColor}; 
                      padding: 12px 25px; 
                      text-decoration: none; 
                      border-radius: 6px; 
                      font-weight: bold;
                      display: inline-block;
                      margin: 0 10px;
                      border: 1px solid ${this.primaryColor};">
              Explore Resources
            </a>
          </div>

          <!-- Contact Info -->
          <div style="background-color: #f8f9ff; padding: 20px; border-radius: 6px; margin-top: 30px;">
            <p style="margin: 0; color: #666;">
              Have questions? Contact our support team at <a href="mailto:support@guardzero.xyz" style="color: ${this.primaryColor};">support@guardzero.xyz</a>
            </p>
          </div>
        </div>

        ${this.brandFooter}
      </div>
    `;
        await this.sendEmail(to, subject, html);
    }
    async sendWaitlistConfirmation(to, name, position) {
        const subject = `Welcome to the ${this.appName} Waitlist!`;
        const formattedDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const html = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${this.primaryColor}; margin: 0; font-size: 28px;">${this.appName}</h1>
          <p style="color: #666; font-size: 16px;">Waitlist Confirmation</p>
        </div>

        <!-- Main Content -->
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Welcome aboard, ${name}! 🎉</h2>
          
          <p style="font-size: 16px; line-height: 1.5;">
            Thank you for joining the ${this.appName} waitlist. We're thrilled to have you with us!
          </p>

          <!-- Waitlist Position Card -->
          <div style="background-color: #f8f9ff; border: 1px solid ${this.primaryColor}; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
            <p style="font-size: 14px; color: #666; margin: 0;">Your Current Position</p>
            <h2 style="color: ${this.primaryColor}; font-size: 36px; margin: 10px 0;">#${position}</h2>
          </div>

          <!-- Details Table -->
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Name:</td>
                <td style="padding: 8px 0; text-align: right;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Email:</td>
                <td style="padding: 8px 0; text-align: right;">${to}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Date Joined:</td>
                <td style="padding: 8px 0; text-align: right;">${formattedDate}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 16px; line-height: 1.5;">
            We'll notify you as soon as it's your turn to join. In the meantime, stay tuned for updates and exciting news about ${this.appName}!
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL}" 
               style="background-color: ${this.primaryColor}; 
                      color: white; 
                      padding: 12px 25px; 
                      text-decoration: none; 
                      border-radius: 6px; 
                      font-weight: bold;
                      display: inline-block;">
              Visit Our Website
            </a>
          </div>
        </div>

        ${this.brandFooter}
      </div>
    `;
        await this.sendEmail(to, subject, html);
    }
}
exports.EmailService = EmailService;
