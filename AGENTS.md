# Project Guidelines & Architecture Memory

## 1. Core Call Connection & WebRTC Stability (CRITICAL)
- **Do NOT break or alter the core signaling or WebRTC connection architecture.**
- Real P2P call matching operates via `UnifiedSignalingClient` (`/src/utils/signaling.ts`) with seamless fallback between WebSocket and HTTP Long-Polling (`/api/signal/*`).
- WebRTC RTCPeerConnection initialization, ICE candidate exchange (`bundlePolicy: 'max-bundle'`), and SDP offer/answer handling in `/src/hooks/useWebRTC.ts` and `/src/App.tsx` have been verified across cellular devices, mobile Safari/Chrome, and desktop browsers.

## 2. Monetization & Monetag Archive
- All advertisement banners and Monetag scripts are disabled per user instruction.
- **Saved Monetization Details** (Archived in `/src/config/monetization.ts`):
  - **Monetag Zone ID**: `273570`
  - **Monetag Tag URL**: `https://quge5.com/88/tag.min.js`
  - **Alternate Tag CDN**: `https://alwingulla.com/tag.min.js`
  - **Ad Slots**: `homeTopBanner`, `dialerPermanentBanner`, `consoleTopBanner`, `consolePermanentBanner`, `callTopBanner`, `inCallUnit`, `waitingTopBanner`, `waitingUnit`, `postCallMrec`, `stickyMobileFooter`.
- When the user asks to enable monetization, toggle `MONETIZATION_CONFIG.enabled = true` in `/src/config/monetization.ts`, insert `<script src="https://quge5.com/88/tag.min.js" data-zone="273570" async data-cfasync="false"></script>` back into `index.html`, and re-enable `AdSlot` placements.
