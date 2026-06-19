import nodemailer from "nodemailer";
import { ContactConfigService } from "./contactConfig.service";

let transporter: any = null;

/**
 * Returns or lazy-initializes the Nodemailer SMTP transporter.
 * Gracefully handles incomplete dev environments by logging outputs instead of throwing errors.
 */
function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = ContactConfigService.getSmtpUser() || process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn(
      "\n======================================================\n" +
      "[EMAIL SERVICE ALERT] SMTP configurations (SMTP_HOST, SMTP_USER, SMTP_PASS) are missing.\n" +
      "Emails will be output to console logs. Please specify credentials in the settings or .env file to activate live SMTP delivery.\n" +
      "======================================================\n"
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  return transporter;
}

export const EmailService = {
  /**
   * Dispatches emails to the SMTP gateway safely, logging failures.
   */
  async sendMail(to: string, subject: string, html: string): Promise<boolean> {
    const fromEmail = ContactConfigService.getFromEmail() || "hello@ubex.com";
    const senderName = "UbEx Concierge";
    
    console.log(`[BETA MONITOR] Outbound email preparing. To: ${to} | Sender: ${fromEmail} | Subject: "${subject}"`);

    const mailOptions = {
      from: `"${senderName}" <${fromEmail}>`,
      to,
      subject,
      html,
    };

    const client = getTransporter();
    if (!client) {
      console.log(`[BETA MONITOR - EMAIL SIMULATED OUTPUT]\nTo: ${to}\nFrom: ${fromEmail}\nSubject: ${subject}\nBody: ${html.substring(0, 300)}...\n`);
      return true;
    }

    try {
      await client.sendMail(mailOptions);
      console.log(`[BETA MONITOR - EMAIL SUCCESS] Email sent successfully to: ${to}`);
      return true;
    } catch (err) {
      console.error(`[BETA MONITOR - EMAIL FAILURE] Failed to send email to ${to} via SMTP:`, err);
      // We explicitly return false to initiate retry queues or alert systems without triggering database rollback
      return false;
    }
  },

  /**
   * Sends user-authored inquiry confirmation emails.
   */
  async sendInquiryConfirmation(recipientEmail: string, inquiryDetails: {
    inquiryId: string;
    inquiryType: string;
    listingTitle: string;
    selectedDate?: string;
    guestCount: number;
    inquiryStatus: string;
  }): Promise<boolean> {
    const inquiryId = inquiryDetails.inquiryId;
    const subject = `[UbEx] Inquiry Confirmation – ${inquiryId}`;
    
    const supportEmail = ContactConfigService.getSupportEmail();
    const whatsappNum = ContactConfigService.getWhatsAppNumber();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Inquiry Confirmation</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); border: 1px solid #e2e8f0; }
          .header { background-color: #0f172a; padding: 40px; text-align: center; }
          .logo { font-size: 28px; font-weight: 900; letter-spacing: -1px; color: #10b981; text-transform: uppercase; margin: 0; }
          .content { padding: 40px; }
          h1 { font-size: 20px; font-weight: 700; color: #020617; margin-top: 0; margin-bottom: 24px; text-align: center; }
          p { font-size: 14px; color: #475569; margin-bottom: 24px; }
          .table-container { background-color: #f1f5f9; border-radius: 16px; padding: 24px; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 8px 0; font-size: 13px; color: #475569; }
          td.label { font-weight: bold; color: #0f172a; width: 40%; }
          td.value { text-align: right; font-family: monospace; font-weight: bold; color: #334155; }
          .highlight-row td.value { color: #059669; font-size: 14px; }
          .badge { background-color: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 6px; font-size: 11px; text-transform: uppercase; font-weight: bold; }
          .steps-box { border-left: 4px solid #10b981; background-color: #f0fdf4; padding: 20px; border-radius: 0 16px 16px 0; margin-bottom: 30px; }
          .steps-title { font-weight: bold; color: #065f46; font-size: 13px; margin-bottom: 6px; }
          .steps-text { font-size: 12px; color: #047857; margin: 0; }
          .footer { background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
          .support-link { color: #10b981; text-decoration: none; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">UBEX</div>
          </div>
          <div class="content">
            <h1>Inquiry Received Successfully</h1>
            <p>Thank you for reaching out to UbEx. Our specialists are evaluating your details to craft your curated adventure trail.</p>
            
            <div class="table-container">
              <table>
                <tr class="highlight-row">
                  <td class="label">Inquiry ID</td>
                  <td class="value">${inquiryId}</td>
                </tr>
                <tr>
                  <td class="label">Type</td>
                  <td class="value" style="text-transform: capitalize;">${inquiryDetails.inquiryType}</td>
                </tr>
                <tr>
                  <td class="label">Property / Experience</td>
                  <td class="value">${inquiryDetails.listingTitle}</td>
                </tr>
                <tr>
                  <td class="label">Date Specified</td>
                  <td class="value">${inquiryDetails.selectedDate || "TBD"}</td>
                </tr>
                <tr>
                  <td class="label">Guests</td>
                  <td class="value">${inquiryDetails.guestCount} Guests</td>
                </tr>
                <tr>
                  <td class="label">Current Status</td>
                  <td class="value"><span class="badge">${inquiryDetails.inquiryStatus}</span></td>
                </tr>
              </table>
            </div>

            <div class="steps-box">
              <div class="steps-title">What happens next?</div>
              <p class="steps-text">An experienced UbEx travel specialist will contact you directly via WhatsApp on your supplied number within 15 minutes to coordinate custom reservation requirements.</p>
            </div>
          </div>
          <div class="footer">
            <p style="margin: 0;">Have immediate questions? Contact support at <a class="support-link" href="https://wa.me/${whatsappNum}">UbEx Live Concierge</a> or email us at <a class="support-link" href="mailto:${supportEmail}">${supportEmail}</a></p>
            <p style="margin: 12px 0 0 0; font-size: 10px; color: #cbd5e1;">&copy; 2026 UbEx Ltd. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail(recipientEmail, subject, html);
  },

  /**
   * Dispatches automated administrative alert emails.
   */
  async sendAdminInquiryNotification(inquiryDetails: {
    inquiryId: string;
    inquiryType: string;
    listingTitle: string;
    guestCount: number;
    sourcePage?: string;
    deviceType?: string;
    createdAt?: Date;
  }): Promise<boolean> {
    const adminEmail = ContactConfigService.getAdminNotificationEmail();
    if (!adminEmail) {
      console.warn("[BETA MONITOR] ADMIN_NOTIFICATION_EMAIL is not specified. Skipping admin alert email.");
      return true; // Return successful to ignore blockage
    }

    const dashboardUrl = process.env.ADMIN_DASHBOARD_URL || "https://ais-dev-kzsq7wrbl354m3mbs4c2vi-1022276328125.asia-southeast1.run.app/admin";
    const subject = `[UbEx] New Inquiry Received – ${inquiryDetails.inquiryId}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Admin Inquiry Alert</title>
        <style>
          body { font-family: sans-serif; background-color: #f3f4f6; padding: 20px; color: #1f2937; }
          .card { max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
          .header { background: #111827; padding: 20px; color: #10b981; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; font-size: 12px; }
          .body { padding: 30px; }
          h2 { margin-top: 0; font-size: 18px; color: #111827; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          td { padding: 10px; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
          td.label { font-weight: bold; color: #4b5563; width: 35%; }
          td.val { font-family: monospace; color: #111827; text-align: right; }
          .btn { display: block; text-align: center; background: #10b981; color: #ffffff; text-decoration: none; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: bold; margin-top: 25px; }
          .footer { padding: 15px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            UbEx Lead Management Gateway
          </div>
          <div class="body">
            <h2>New Marketplace Inquiry Registered</h2>
            <p style="font-size: 13px; color: #6b7280;">A guest has compiled dynamic reservation details on the UbEx client application. Please claim and verify the lead promptly to safeguard conversion speeds.</p>
            
            <table>
              <tr>
                <td class="label">Inquiry ID</td>
                <td class="val" style="font-weight: bold; color: #10b981;">${inquiryDetails.inquiryId}</td>
              </tr>
              <tr>
                <td class="label">Channel / Type</td>
                <td class="val">${inquiryDetails.inquiryType}</td>
              </tr>
              <tr>
                <td class="label">Listing/Context</td>
                <td class="val">${inquiryDetails.listingTitle}</td>
              </tr>
              <tr>
                <td class="label">Guest Counts</td>
                <td class="val">${inquiryDetails.guestCount} Guests</td>
              </tr>
              <tr>
                <td class="label">Source Page</td>
                <td class="val">${inquiryDetails.sourcePage || "App Client"}</td>
              </tr>
              <tr>
                <td class="label">Client Device</td>
                <td class="val">${inquiryDetails.deviceType || "Unknown"}</td>
              </tr>
              <tr>
                <td class="label">Timestamp</td>
                <td class="val">${new Date().toISOString()}</td>
              </tr>
            </table>

            <a href="${dashboardUrl}" class="btn">Launch Admin OS Control Center</a>
          </div>
          <div class="footer">
            UbEx Platform Automations Engine &bull; Security Category: Confidential
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail(adminEmail, subject, html);
  },

  /**
   * Verifies contact/transport connectivity to active SMTP server.
   */
  async verifySmtpConnection(): Promise<boolean> {
    const t = getTransporter();
    if (!t) return false;
    try {
      await t.verify();
      return true;
    } catch (err) {
      console.error("[SMTP ERROR] Connection/Authentication failed:", err);
      return false;
    }
  },

  /**
   * Refactored OTP authentication notification.
   */
  async sendOtpEmail(destinationEmail: string, otp: string, expirationMinutes: number = 5): Promise<boolean> {
    const subject = `[UbEx] Administrative Authorization OTP Code: ${otp}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Auth OTP Verification</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; padding: 40px; margin: 0; }
          .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
          .logo-header { background-color: #0f172a; padding: 30px; text-align: center; }
          .logo { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #10b981; }
          .body { padding: 40px; text-align: center; }
          h2 { font-size: 18px; color: #0f172a; margin-top: 0; margin-bottom: 20px; }
          p { font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 30px; }
          .code-box { background-color: #f1f5f9; padding: 20px; font-family: monospace; font-size: 32px; font-weight: bold; color: #0f172a; letter-spacing: 8px; border-radius: 12px; display: inline-block; width: 80%; margin: 0 auto 30px auto; text-indent: 8px; }
          .note { font-size: 11px; color: #94a3b8; margin: 0; }
          .footer { padding: 20px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo-header">
            <span class="logo">UBEX ADMINISTRATIVE HUB</span>
          </div>
          <div class="body">
            <h2>Two-Factor Authorization Code</h2>
            <p>Please use the following 6-digit verification security code to complete your administrative authentication verification step. Do NOT share this code with anyone.</p>
            
            <div class="code-box">${otp}</div>

            <p class="note">This security code has an active lifetime validity of <strong>${expirationMinutes} minutes</strong> and will be rotated automatically upon expiration.</p>
          </div>
          <div class="footer">
            UbEx Security Center Policy System &bull; Restricted Access
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail(destinationEmail, subject, html);
  }
};

export default EmailService;
