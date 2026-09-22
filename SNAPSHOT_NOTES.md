# QuikTalks Working State Snapshot & Restore Guide

**Snapshot Tag:** `v1.0.0-working-state`  
**Git Branch:** `backup/working-state-2026-09-07`  
**Git Commit:** `50f44ab`  
**Timestamp:** 2026-09-07  
**Status:** ✅ Fully Working & Verified  

---

## 1. Summary of Working State & Verified Capabilities

At this snapshot, the application is in an end-to-end verified, stable working state:

### 🎙️ WebRTC P2P Voice Calling & Signaling Engine
- **Dual-Mode Unified Signaling (`src/utils/signaling.ts`)**:
  - Seamless automatic failover between WebSocket (`/api/signal/ws`) and HTTP Long-Polling (`/api/signal/*`).
  - **Sequential Outbound Batching**: Ordered FIFO queue draining for HTTP signaling requests (`messages: [...]`), preventing race conditions during rapid ICE candidate exchange.
  - Matches are immediately prioritized by clearing obsolete `queue_status` pings from peer queues upon pairing.
- **Audio Pipeline (`src/hooks/useWebRTC.ts`)**:
  - Full P2P voice call connection with STUN fallback (`bundlePolicy: 'max-bundle'`).
  - Persistent hardware speaker audio sink (`#voicetalk-remote-audio`) mounted in the DOM to prevent mobile WebKit/Blink audio track throttling.
  - Audio cues and volume meters fully functional.

### 🛡️ Dev Server & Backend Safeguards (`server.ts`)
- **Global Error Handlers**: `process.on('unhandledRejection')` and `process.on('uncaughtException')` prevent unexpected crashes from transient network drops or socket disconnections.
- **Fail-Fast Port Recovery**: `EADDRINUSE` listener ensures immediate clean restart if port 3000 encounters a collision.
- **Hybrid Vite + Express**: Development mode uses Vite middleware; production mode serves compiled static files from `dist/`.
- **Verified Endpoints**:
  - `GET /api/health` → `200 OK` (returns online users, queue length, active rooms, match stats).
  - `POST /api/signal/connect`, `/send`, `/poll` → `200 OK`.
  - Frontend root `/` and `/src/main.tsx` → `200 OK`.

### 🗄️ Database & Environment Configuration
- **Database (`data/analytics_sessions.json`)**: Persistent JSON session store with active session tracking, country/device analytics, and visitor logs.
- **Environment (`.env.example`)**: Declares `GEMINI_API_KEY` and `APP_URL`.
- **Permissions & Platform (`metadata.json`)**: Configured for `microphone` frame permission and `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`.
- **Deployment Manifests**: `Dockerfile`, `railway.json`, and `nixpacks.toml` configured for Cloud Run / container deployment.

---

## 2. Backup Locations & Artifacts

The working state has been saved in three independent layers to ensure 100% resilience:

1. **Git Repository Tag & Branch**:
   - Tag: `v1.0.0-working-state`
   - Branch: `backup/working-state-2026-09-07`
   - Commit: `50f44ab` (71 files committed with clean working tree)

2. **Standalone File System Backup Archive**:
   - Path: `/backups/snapshot-working-2026-09-07.tar.gz` (contains full codebase, configs, and assets).

3. **Uncompressed Snapshot Directory**:
   - Path: `/backups/snapshot-2026-09-07/` (instant file inspection without decompression).

4. **Database Snapshot**:
   - Path: `/backups/database/analytics_sessions.json`

---

## 3. How to Request a Rollback

If any future update causes an issue and you want to restore this exact working state, you can use any of the following methods:

### Option A: Simply Ask the AI Assistant in Chat
Send a message like:
> **"Please rollback the app to the working snapshot (v1.0.0-working-state)."**  
> or  
> **"Restore the backup from 2026-09-07."**

The assistant will run the restore script and restart the dev server to return the applet to this exact checkpoint.

### Option B: Run the One-Click Restore Script via Terminal
You or the assistant can execute:
```bash
node restore-snapshot.mjs
```
This script automatically:
1. Reverts Git to tag `v1.0.0-working-state`
2. Restores files from `backups/snapshot-working-2026-09-07.tar.gz`
3. Restores `data/analytics_sessions.json` from `backups/database/analytics_sessions.json`

### Option C: Manual Git Command
```bash
git checkout v1.0.0-working-state
```
