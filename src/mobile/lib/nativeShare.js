import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";

// In the App Store app the web view has no working share feature, and the
// page's own address is the app's internal one (capacitor://localhost). Every
// share button calls navigator.share with a link built from that address, so
// this swaps in the iPhone's share sheet and the public website's address.
// Set VITE_PUBLIC_SITE_URL to the live site once it has its own domain.
const PUBLIC_SITE = (import.meta.env.VITE_PUBLIC_SITE_URL
  || "https://town-center-git-admin-panel-muhammad-abuzar-s46-projects1.vercel.app").replace(/\/$/, "");

export function installNativeShare() {
  if (!Capacitor.isNativePlatform()) return;
  const publicUrl = (url) => {
    if (!url) return PUBLIC_SITE;
    try {
      const u = new URL(url, window.location.href);
      if (u.origin !== window.location.origin) return u.href;
      return `${PUBLIC_SITE}${u.pathname}${u.search}`;
    } catch {
      return url;
    }
  };
  navigator.share = async ({ title, text, url } = {}) => {
    await Share.share({ title, text, url: publicUrl(url), dialogTitle: "Share" });
  };
  navigator.canShare = () => true;
}
