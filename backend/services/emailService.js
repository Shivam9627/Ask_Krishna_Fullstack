const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    
    // Initialize email transporter if credentials are provided
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      this.isConfigured = true;
      console.log('✅ Email service configured');
    } else {
      console.warn('⚠️  Email service not configured. OTP emails will not be sent.');
      console.warn('   Set EMAIL_USER and EMAIL_PASS in .env to enable email functionality');
    }
  }

  /**
   * Send OTP email
   * @param {string} email - Recipient email
   * @param {string} otp - OTP code
   * @param {string} type - 'registration' or 'delete'
   */
  async sendOTP(email, otp, type = 'registration') {
    if (!this.isConfigured) {
      // In development, log OTP to console
      console.log(`\n📧 OTP Email (${type}):`);
      console.log(`   To: ${email}`);
      console.log(`   OTP: ${otp}\n`);
      return { success: true, message: 'OTP logged to console (email not configured)' };
    }

    try {
      const subject = type === 'registration' 
        ? 'Verify Your Email - Ask Krishna'
        : 'Account Deletion Confirmation - Ask Krishna';

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0;">Ask Krishna</h1>
            <p style="margin: 10px 0 0 0;">Bhagavad Gita Guidance</p>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">${type === 'registration' ? 'Verify Your Email' : 'Confirm Account Deletion'}</h2>
            <p style="color: #666; line-height: 1.6;">
              ${type === 'registration' 
                ? 'Thank you for registering with Ask Krishna! Please use the following OTP to verify your email address:'
                : 'You have requested to delete your account. Please use the following OTP to confirm the deletion:'}
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: monospace;">
                ${otp}
              </div>
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              This OTP will expire in 10 minutes. Please do not share this code with anyone.
            </p>
          </div>
          <div style="background: #333; padding: 20px; text-align: center; color: #999; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Ask Krishna. All rights reserved.</p>
          </div>
        </div>
      `;

      const info = await this.transporter.sendMail({
        from: `"Ask Krishna" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        html: html
      });

      console.log('✅ OTP email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending email:', error);
      // In case of error, still log to console for development
      console.log(`\n📧 OTP (fallback): ${otp} for ${email}\n`);
      throw new Error('Failed to send email. Please check your email configuration.');
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
