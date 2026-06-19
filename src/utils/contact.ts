/**
 * Utility functions for obtaining centralized contact parameters
 * strictly guided by environment rules, preventing hardcoded values in UI components.
 */

export function getWhatsAppNumber(): string {
  return (
    import.meta.env.VITE_UBEX_WHATSAPP_NUMBER ||
    (window as any).__UBEX_CONFIG__?.UBEX_WHATSAPP_NUMBER ||
    ""
  ).trim();
}

export function getSupportEmail(): string {
  return (
    import.meta.env.VITE_SUPPORT_EMAIL ||
    (window as any).__UBEX_CONFIG__?.SUPPORT_EMAIL ||
    ""
  ).trim();
}
