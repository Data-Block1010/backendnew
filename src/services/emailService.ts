import { transporter } from '../config/email.config';

export class EmailService {
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html
      });
      console.log('Email sent successfully to:', to);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendWaitlistConfirmation(to: string, name: string, position: number): Promise<void> {
    const subject = 'Welcome to our Waitlist!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to the Waitlist!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for joining our waitlist. You are currently in position <strong>#${position}</strong>.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Your Details:</strong></p>
          <p style="margin: 10px 0;">Name: ${name}</p>
          <p style="margin: 10px 0;">Position: #${position}</p>
          <p style="margin: 10px 0;">Date: ${new Date().toLocaleDateString()}</p>
        </div>
        <p>We'll notify you when it's your turn to join. Stay tuned!</p>
        <p>Best regards,<br>Your App Team</p>
      </div>
    `;

    await this.sendEmail(to, subject, html);
  }
}