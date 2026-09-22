/**
 * Monetization & Advertising Configuration
 * 
 * Saved configuration for Monetag and advertising banners.
 * Set `MONETIZATION_ENABLED = true` to reactivate all Monetag banners,
 * zones, and ad units across the application.
 */

export const MONETIZATION_CONFIG = {
  // Master switch - disabled per user request
  enabled: false,

  // Monetag Account & Zone Metadata
  monetag: {
    zoneId: '273570',
    tagScriptUrl: 'https://quge5.com/88/tag.min.js',
    alternateTagUrl: 'https://alwingulla.com/tag.min.js',
  },

  // Saved Ad Slot Registrations
  slots: {
    homeTopBanner: 'monetag-home-top-banner',
    dialerPermanentBanner: 'monetag-dialer-permanent-banner',
    consoleTopBanner: 'monetag-console-top-banner',
    consolePermanentBanner: 'monetag-console-permanent-banner',
    callTopBanner: 'monetag-call-top-banner',
    inCallUnit: 'monetag-incall-unit',
    waitingTopBanner: 'monetag-waiting-top-banner',
    waitingUnit: 'monetag-waiting-unit',
    postCallMrec: 'monetag-postcall-mrec',
    stickyMobileFooter: 'monetag-sticky-mobile',
    safetyModalAd: 'voice-safety-ad',
    privacyModalAd: 'voice-privacy-ad',
  }
} as const;
