/**
 * ContactConfigService manages centralized contact details for UbEx.
 * All critical channels must map strictly to environment variable parameters.
 */
export const ContactConfigService = {
  getWhatsAppNumber(): string {
    return (process.env.UBEX_WHATSAPP_NUMBER || "").trim();
  },
  
  getFromEmail(): string {
    return (process.env.FROM_EMAIL || "").trim();
  },

  getAdminNotificationEmail(): string {
    return (process.env.ADMIN_NOTIFICATION_EMAIL || "").trim();
  },

  getSupportEmail(): string {
    return (process.env.SUPPORT_EMAIL || "").trim();
  },

  getSmtpUser(): string {
    return (process.env.SMTP_USER || "").trim();
  }
};

export default ContactConfigService;
