import { mock } from "../client";

const DEFAULT_SETTINGS = {
  admin: { name: "Babar Afzal", email: "admin@maidenheadtowncentre.co.uk", role: "Super Admin" },
  platform: {
    siteName: "Maidenhead Town Centre Portal",
    supportEmail: "hello@maidenheadtowncentre.co.uk",
    approvalRequired: true,
    xmlSyncHour: 6,
    maxGalleryImages: 8,
    featuredListingsMax: 3,
  },
};

export function getSettings() {
  return mock(DEFAULT_SETTINGS);
}

export function saveSettings(settings) {
  return mock({ ...settings, savedAt: new Date().toISOString() });
}
