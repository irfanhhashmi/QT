import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import {
  TIMEZONE_TO_COUNTRY_MAP,
  COUNTRIES,
  getCountryByCode,
  getCountryFlag,
  getCountryName,
  DetectedCountryResult,
} from "./src/data/countries";
import {
  AI_FEMALE_PERSONAS,
  AiPersona,
  getRandomAiPersona,
  getAiPersonaById,
} from "./src/data/aiPersonas";
import { getRealConversationalReply } from "./src/data/conversationalReplies";
import { analyticsManager } from "./src/server/analytics";

interface SignalingPeer {
  id: string;
  type: 'ws' | 'http';
  isOpen: () => boolean;
  send: (payload: any) => void;
  headers: Record<string, string | string[] | undefined>;
  verifiedCountry: DetectedCountryResult;
  lastActive: number;
  httpQueue?: any[];
  httpResolver?: ((msgs: any[]) => void) | null;
  httpTimeout?: NodeJS.Timeout | null;
}

interface QueuedUser {
  peer: SignalingPeer;
  id: string;
  mode: 'voice' | 'text';
  language: string;
  userCountry: string;
  preferredCountries: string[];
  restrictedCountries: string[];
  region?: string;
  tags: string[];
  userGender: string;
  preferredGender: string;
  strictGender: boolean;
  callsign: string;
  joinedAt: number;
  allowAi?: boolean;
  roomCode?: string;
}

interface ActiveRoom {
  id: string;
  mode: 'voice' | 'text';
  user1: { peer: SignalingPeer; id: string; callsign: string; tags: string[]; language: string; userCountry: string };
  user2?: { peer: SignalingPeer; id: string; callsign: string; tags: string[]; language: string; userCountry: string };
  isAiCompanion?: boolean;
  aiPersona?: AiPersona;
  createdAt: number;
}

// Track peers who have hung up on AI or opted out of AI calls
const aiDisabledPeers = new Set<string>();

// Lazy-initialized Gemini AI instance
let genAiInstance: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAiInstance && process.env.GEMINI_API_KEY) {
    try {
      genAiInstance = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (e) {
      console.warn("Failed to initialize GoogleGenAI:", e);
    }
  }
  return genAiInstance;
}

// Track AI Persona rotation per user to cycle through all 50 female personas seamlessly
const peerPersonaRotation = new Map<string, number>();

function getNextAiPersonaForPeer(peerId: string): AiPersona {
  const currentIdx = peerPersonaRotation.get(peerId) ?? -1;
  const nextIdx = (currentIdx + 1) % AI_FEMALE_PERSONAS.length;
  peerPersonaRotation.set(peerId, nextIdx);
  return AI_FEMALE_PERSONAS[nextIdx];
}

async function synthesizeSpeechWithGemini(text: string, persona: AiPersona): Promise<string | null> {
  const ai = getGenAI();
  if (!ai || !text) return null;

  try {
    // Select best prebuilt voice ('Kore' or 'Zephyr' for natural female voice tone)
    const voiceName = (persona.pitch && persona.pitch > 1.05) ? 'Kore' : 'Zephyr';

    const ttsPromise = ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: text.slice(0, 300) }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
    const response: any = await Promise.race([ttsPromise, timeoutPromise]);

    const base64Audio = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (err) {
    console.warn("Gemini TTS audio synthesis notice:", err);
    return null;
  }
}

async function generateAiPersonaReply(
  persona: AiPersona,
  userMessage: string,
  userCallsign: string = 'Caller',
  userCountry: string = 'US',
  history: Array<{ role: 'user' | 'assistant'; text: string }> = []
): Promise<string> {
  const directReply = getRealConversationalReply(userMessage, persona, userCallsign, userCountry);
  
  const fallbackReplies = [
    `I hear you! What else are you up to today?`,
    `Tell me more about that! How has your day been going?`,
    `That's so interesting! Where are you calling from today?`,
    `That sounds fun! What kind of music or shows have you been into lately?`,
    `I totally get that! What's the best thing that happened to you today?`,
    `Nice! I'm just relaxing here in ${persona.city}. What about you?`
  ];
  const randomFallback = directReply || fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];

  const ai = getGenAI();
  if (!ai) {
    return randomFallback;
  }

  const systemInstruction = `You are ${persona.name} (callsign: ${persona.callsign}), the website robot agent for QuikTalks.
CONTEXT & ROLE:
All human callers on the website are currently connected with each other on calls. You are keeping this caller ("${userCallsign || 'Caller'}" from ${userCountry || 'somewhere in the world'}) company while they wait for a human caller to become available.

RULES FOR PHONE CONVERSATION:
1. Be warm, friendly, natural, and honest.
   - If asked if you are a robot/AI/agent: confirm happily that you are the website's AI robot agent, keeping them company while all other human callers are connected.
   - If they say "yes", "sure", "okay", "let's talk", or agreed to talk: thank them and ask a friendly question about how their day is going, their name, or their location.
   - If they say "hello", "hi", "hey": greet them warmly ("Hey! How are you doing? I'm ${persona.name}, the website robot agent. What's your name?").
   - If they tell you their name: acknowledge their name warmly ("Nice to meet you, [name]! How has your day been?").
   - If they ask how you are: answer that you're doing great, and ask about them.
   - If they ask a question: answer it directly first, then keep the chat moving.
2. Keep it natural and concise for speech: 1 to 2 short sentences (10 to 25 words maximum).
3. NEVER write the literal words "haha", "hehe", "lol", "lmao", "rofl", or "hmm".
4. NEVER write stage directions or text markers like *laughs*, *giggles*, [smiles], or (chuckles).
5. Use natural contractions ("I'm", "it's", "you're", "can't", "don't") and a lively, polite tone.`;

  const formattedContents = [
    ...history.slice(-6).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    })),
    {
      role: 'user',
      parts: [{ text: userMessage }]
    }
  ];

  const candidateModels = ['gemini-2.5-flash'];

  for (const modelName of candidateModels) {
    try {
      const generatePromise = ai.models.generateContent({
        model: modelName,
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.85,
          maxOutputTokens: 100,
        }
      });

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
      const response: any = await Promise.race([generatePromise, timeoutPromise]);

      if (response && response.text) {
        let clean = response.text.trim().replace(/^["']|["']$/g, '');
        // Strip stage directions, asterisks, brackets, parentheticals
        clean = clean.replace(/\[.*?\]|\*.*?\*|\(.*?\)/g, '').trim();
        // Remove character name or persona prefix if model prefixed it
        clean = clean.replace(/^(persona|assistant|agent|robot|\w+):\s*/i, '').trim();
        // Remove literal "haha" / "hehe" words so speech synthesizer never sounds mechanical
        clean = clean.replace(/\b(ha(ha)+|he(he)+|lol|lmao|rofl|xd)\b/gi, '').replace(/\s{2,}/g, ' ').trim();
        if (clean && clean.length > 3) return clean;
      }
    } catch (err: any) {
      const errStr = String(err?.status || err?.code || err?.message || '');
      if (errStr.includes('503') || errStr.includes('429') || errStr.includes('UNAVAILABLE') || errStr.includes('high demand') || errStr.includes('404') || errStr.includes('NOT_FOUND')) {
        continue;
      }
      console.warn(`Gemini (${modelName}) notice:`, err?.message || err);
    }
  }

  return randomFallback;
}

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Enable trust proxy for Cloud Run, Cloudflare, and custom domain proxies
app.set("trust proxy", true);

// Universal CORS & Preflight middleware
import cors from 'cors';

app.use(cors({
  origin: [
    'https://app.quiktalks.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Monetag Service Worker endpoints & Verification handlers (Mounted FIRST)
const monetagSWContent = `self.options = {
    "domain": "5gvci.com",
    "zoneId": 11671024
}
self.lary = ""
importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw')
`;

const serveMonetagSW = (req: express.Request, res: express.Response) => {
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Service-Worker-Allowed", "/");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  res.status(200).send(monetagSWContent);
};

app.all([
  "/sw.js",
  "/service-worker.js",
  "/sw.min.js",
  "/service-worker.min.js",
  "/sw-11671024.js",
  "/sw-11663462.js",
  "/sw-11663650.js",
  "/sw-273570.js",
  "/sw-worker.js",
  "/worker.js"
], serveMonetagSW);

// Catch-all for any other sw*.js request
app.get(/^\/sw.*\.js$/, serveMonetagSW);

app.use(express.json());
app.use(express.text({ type: ['text/plain', 'application/json'] }));
app.use(express.static(path.join(process.cwd(), "public")));

// Helper: Parse user agent for device and browser information
function parseUserAgent(ua: string = '') {
  let device: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    device = 'tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    device = 'mobile';
  }

  let browser = 'Unknown';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome|crios/i.test(ua) && !/opr|opera/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/opr|opera/i.test(ua)) browser = 'Opera';

  let os = 'Unknown OS';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  return { device, browser, os };
}

// Create WebSocket server with explicit upgrade handling for custom domains & reverse proxies
const wss = new WebSocketServer({ noServer: true });

wss.on("error", (err) => {
  console.warn("WebSocket server error:", err);
});

server.on("upgrade", (req, socket, head) => {
  socket.on("error", (err) => {
    console.warn("Socket error during upgrade:", err);
  });

  let pathname = "";
  try {
    pathname = new URL(req.url || "", `http://${req.headers.host || "localhost"}`).pathname;
  } catch {
    pathname = (req.url || "").split("?")[0];
  }

  // Handle all websocket paths (/ws, /api/signal/ws, /api/ws)
  if (pathname === "/ws" || pathname.startsWith("/ws") || pathname.includes("ws") || pathname.startsWith("/api/signal")) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  }
});

const queue: QueuedUser[] = [];
const activeRooms = new Map<string, ActiveRoom>();
const peerRooms = new Map<string, string>(); // peerId -> roomId
const allPeers = new Map<string, SignalingPeer>(); // peerId -> SignalingPeer

let totalMatchesMade = 1420;

// Online user counter baseline: 1000 baseline (0 connected users = 1000, each real user increments by +1)
const BASELINE_ONLINE_USERS = 1000;

function getDisplayOnlineUsers(): number {
  return BASELINE_ONLINE_USERS + allPeers.size;
}

function broadcastStats() {
  const statsPayload = {
    type: 'stats',
    stats: {
      onlineUsers: getDisplayOnlineUsers(),
      realUsers: allPeers.size,
      activeRooms: activeRooms.size,
      totalMatches: totalMatchesMade,
    }
  };
  for (const peer of allPeers.values()) {
    if (peer.isOpen()) {
      try {
        peer.send(statsPayload);
      } catch {
        // ignore send error
      }
    }
  }
}

// Helper: generate random ID
function generateId(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
}

// Server-authoritative country detection: checks cloud headers, timezones, and telemetry
function resolveCountry(
  headers: Record<string, string | string[] | undefined>,
  clientTelemetry?: { timezone?: string; languages?: string[] }
): DetectedCountryResult {
  // 1. Cloudflare / Cloud Provider Geo Headers (Most authoritative)
  const cloudCountryHeader =
    (headers['cf-ipcountry'] as string) ||
    (headers['x-country-code'] as string) ||
    (headers['x-client-geo-location-country'] as string) ||
    (headers['x-appengine-country'] as string);

  if (cloudCountryHeader && cloudCountryHeader.length === 2 && cloudCountryHeader !== 'XX' && cloudCountryHeader !== 'T1') {
    const code = cloudCountryHeader.toUpperCase();
    const match = getCountryByCode(code);
    if (match) {
      return {
        code: match.code,
        name: match.name,
        flag: match.flag,
        isVerified: true,
        source: 'server_ip',
      };
    }
  }

  // 2. Hardware / System Timezone signature (Tamper-resistant OS clock & IANA Timezone)
  const tz =
    clientTelemetry?.timezone ||
    (headers['x-timezone'] as string) ||
    (headers['x-client-timezone'] as string);

  if (tz && TIMEZONE_TO_COUNTRY_MAP[tz]) {
    const code = TIMEZONE_TO_COUNTRY_MAP[tz];
    const match = getCountryByCode(code);
    if (match) {
      return {
        code: match.code,
        name: match.name,
        flag: match.flag,
        isVerified: true,
        source: 'system_telemetry',
      };
    }
  }

  // 3. Locale / Accept-Language analysis (e.g. "ur-PK", "en-US", "en-GB", "es-MX", "pt-BR")
  const acceptLang = (headers['accept-language'] as string) || '';
  const langList = [
    ...(clientTelemetry?.languages || []),
    ...acceptLang.split(',').map((l) => l.split(';')[0].trim()),
  ];

  for (const lang of langList) {
    if (!lang) continue;
    const parts = lang.split('-');
    if (parts.length >= 2) {
      const candidateCode = parts[parts.length - 1].toUpperCase();
      if (candidateCode.length === 2) {
        const match = getCountryByCode(candidateCode);
        if (match) {
          return {
            code: match.code,
            name: match.name,
            flag: match.flag,
            isVerified: true,
            source: 'system_telemetry',
          };
        }
      }
    }
  }

  // 4. Default Verified Fallback
  return {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    isVerified: true,
    source: 'fallback',
  };
}

// Check gender compatibility with instant fallback
function isGenderCompatible(u1: QueuedUser, u2: QueuedUser, now: number): boolean {
  // If neither user checked strict gender, allow instant pairing
  if (!u1.strictGender && !u2.strictGender) return true;

  const u1TimeInQueue = now - u1.joinedAt;
  const u2TimeInQueue = now - u2.joinedAt;

  // If either has waited >= 3000ms, relax strict gender to prioritize connecting real humans
  if (u1TimeInQueue >= 3000 || u2TimeInQueue >= 3000) {
    return true;
  }

  const u1WantsAny = u1.preferredGender === 'any' || u1.preferredGender === 'unspecified';
  const u2WantsAny = u2.preferredGender === 'any' || u2.preferredGender === 'unspecified';

  const u1AcceptsU2 = u1WantsAny || u1.preferredGender === u2.userGender || u2.userGender === 'unspecified';
  const u2AcceptsU1 = u2WantsAny || u2.preferredGender === u1.userGender || u1.userGender === 'unspecified';

  return u1AcceptsU2 && u2AcceptsU1;
}

// Check if either user has restricted the other user's country
function isCountryRestricted(u1: QueuedUser, u2: QueuedUser, now: number): boolean {
  const u1TimeInQueue = now - u1.joinedAt;
  const u2TimeInQueue = now - u2.joinedAt;

  // After 4000ms, relax country restrictions between real humans to prioritize human connection over AI
  if (u1TimeInQueue >= 4000 || u2TimeInQueue >= 4000) {
    return false;
  }

  if (u1.userCountry && u2.restrictedCountries && u2.restrictedCountries.length > 0) {
    if (u2.restrictedCountries.some(c => c.toUpperCase() === u1.userCountry.toUpperCase())) {
      return true;
    }
  }
  if (u2.userCountry && u1.restrictedCountries && u1.restrictedCountries.length > 0) {
    if (u1.restrictedCountries.some(c => c.toUpperCase() === u2.userCountry.toUpperCase())) {
      return true;
    }
  }
  return false;
}

// Calculate compatibility score (preferred countries + overlapping tags + same language = higher score)
function calculateScore(u1: QueuedUser, u2: QueuedUser): number {
  let score = 10;
  if (u1.language === u2.language && u1.language !== 'any') score += 20;

  // Preferred countries boost
  if (u1.preferredCountries && u1.preferredCountries.length > 0 && u2.userCountry) {
    if (u1.preferredCountries.some(c => c.toUpperCase() === u2.userCountry.toUpperCase())) {
      score += 35;
    }
  }
  if (u2.preferredCountries && u2.preferredCountries.length > 0 && u1.userCountry) {
    if (u2.preferredCountries.some(c => c.toUpperCase() === u1.userCountry.toUpperCase())) {
      score += 35;
    }
  }

  const tagSet = new Set(u1.tags.map(t => t.toLowerCase()));
  for (const t of u2.tags) {
    if (tagSet.has(t.toLowerCase())) {
      score += 15;
    }
  }
  return score;
}

// Matchmaking processor: REAL HUMAN CALLS ONLY
function processQueue() {
  if (queue.length === 0) return;

  const now = Date.now();
  const matchedIndices = new Set<number>();

  // 0. TOP PRIORITY (Priority 0): Private Room / Deep Link Matching
  // When users join with a specific room code, match them together instantly!
  const privateRoomMap = new Map<string, number[]>();
  for (let i = 0; i < queue.length; i++) {
    if (matchedIndices.has(i)) continue;
    const u = queue[i];
    if (!u.peer.isOpen()) {
      matchedIndices.add(i);
      continue;
    }
    if (u.roomCode && u.roomCode.trim()) {
      const code = u.roomCode.trim().toLowerCase();
      if (!privateRoomMap.has(code)) {
        privateRoomMap.set(code, []);
      }
      privateRoomMap.get(code)!.push(i);
    }
  }

  for (const [code, indices] of privateRoomMap.entries()) {
    while (indices.length >= 2) {
      const idx1 = indices.shift()!;
      const idx2 = indices.shift()!;
      matchedIndices.add(idx1);
      matchedIndices.add(idx2);

      const u1 = queue[idx1];
      const u2 = queue[idx2];
      const roomId = `room_priv_${code}`;

      console.log(`[Matchmaking] Private room matched for code '${code}' between ${u1.id} and ${u2.id}`);

      const room: ActiveRoom = {
        id: roomId,
        mode: u1.mode || u2.mode || 'voice',
        user1: { peer: u1.peer, id: u1.id, callsign: u1.callsign, tags: u1.tags, language: u1.language, userCountry: u1.userCountry },
        user2: { peer: u2.peer, id: u2.id, callsign: u2.callsign, tags: u2.tags, language: u2.language, userCountry: u2.userCountry },
        createdAt: Date.now()
      };

      activeRooms.set(roomId, room);
      peerRooms.set(u1.peer.id, roomId);
      peerRooms.set(u2.peer.id, roomId);
      totalMatchesMade++;

      try {
        u1.peer.send({
          type: 'matched',
          roomId,
          roomCode: code,
          isInitiator: true,
          mode: u1.mode,
          peerInfo: {
            id: u2.id,
            callsign: u2.callsign,
            gender: u2.userGender,
            language: u2.language,
            country: u2.userCountry,
            region: u2.region,
            tags: u2.tags,
          },
          commonTags: ['Direct Invite', 'Private Room']
        });

        u2.peer.send({
          type: 'matched',
          roomId,
          roomCode: code,
          isInitiator: false,
          mode: u2.mode,
          peerInfo: {
            id: u1.id,
            callsign: u1.callsign,
            gender: u1.userGender,
            language: u1.language,
            country: u1.userCountry,
            region: u1.region,
            tags: u1.tags,
          },
          commonTags: ['Direct Invite', 'Private Room']
        });
      } catch (err) {
        console.error('Error sending private matched payload:', err);
      }
    }
  }

  // 1. Regular Human-to-Human matching (exclude users waiting in private rooms)
  if (queue.length >= 2) {
    for (let i = 0; i < queue.length; i++) {
      if (matchedIndices.has(i)) continue;
      const u1 = queue[i];

      if (!u1.peer.isOpen()) {
        matchedIndices.add(i);
        continue;
      }

      // If user is waiting for a private room invite or requested direct AI test, skip general matching
      if (u1.roomCode || (u1 as any).forceAi) continue;

      let bestMatchIdx = -1;
      let highestScore = -1;

      for (let j = i + 1; j < queue.length; j++) {
        if (matchedIndices.has(j)) continue;
        const u2 = queue[j];

        if (!u2.peer.isOpen()) {
          matchedIndices.add(j);
          continue;
        }

        if (u2.roomCode || (u2 as any).forceAi) continue;
        if (u1.mode !== u2.mode) continue;
        if (isCountryRestricted(u1, u2, now)) continue;
        if (!isGenderCompatible(u1, u2, now)) continue;

        const score = calculateScore(u1, u2);
        if (score > highestScore) {
          highestScore = score;
          bestMatchIdx = j;
        }
      }

      if (bestMatchIdx !== -1) {
        matchedIndices.add(i);
        matchedIndices.add(bestMatchIdx);

        const u2 = queue[bestMatchIdx];
        const roomId = generateId('room');

        console.log(`[Matchmaking] Successfully matched real peers ${u1.id} and ${u2.id} in room ${roomId}`);

        const commonTags = u1.tags.filter(t => 
          u2.tags.some(t2 => t2.toLowerCase() === t.toLowerCase())
        );

        const room: ActiveRoom = {
          id: roomId,
          mode: u1.mode,
          user1: { peer: u1.peer, id: u1.id, callsign: u1.callsign, tags: u1.tags, language: u1.language, userCountry: u1.userCountry },
          user2: { peer: u2.peer, id: u2.id, callsign: u2.callsign, tags: u2.tags, language: u2.language, userCountry: u2.userCountry },
          createdAt: Date.now()
        };

        activeRooms.set(roomId, room);
        peerRooms.set(u1.peer.id, roomId);
        peerRooms.set(u2.peer.id, roomId);
        totalMatchesMade++;

        // Clear any obsolete queue_status messages from both peers' HTTP queues so matched is processed immediately
        if (u1.peer.type === 'http' && (u1.peer as any).httpQueue) {
          (u1.peer as any).httpQueue = (u1.peer as any).httpQueue.filter((m: any) => m.type !== 'queue_status');
        }
        if (u2.peer.type === 'http' && (u2.peer as any).httpQueue) {
          (u2.peer as any).httpQueue = (u2.peer as any).httpQueue.filter((m: any) => m.type !== 'queue_status');
        }

        // Send match confirmation to both users
        try {
          u1.peer.send({
            type: 'matched',
            roomId,
            isInitiator: true,
            mode: u1.mode,
            peerInfo: {
              id: u2.id,
              callsign: u2.callsign,
              gender: u2.userGender,
              language: u2.language,
              country: u2.userCountry,
              region: u2.region,
              tags: u2.tags,
            },
            commonTags
          });

          u2.peer.send({
            type: 'matched',
            roomId,
            isInitiator: false,
            mode: u2.mode,
            peerInfo: {
              id: u1.id,
              callsign: u1.callsign,
              gender: u1.userGender,
              language: u1.language,
              country: u1.userCountry,
              region: u1.region,
              tags: u1.tags,
            },
            commonTags
          });
        } catch (err) {
          console.error('Error sending matched payload:', err);
        }
      }
    }
  }

  // Remove matched users in reverse order
  const toRemove = Array.from(matchedIndices).sort((a, b) => b - a);
  for (const idx of toRemove) {
    queue.splice(idx, 1);
  }
}

// Run matchmaking ticker every 200ms for ultra-responsive instant pairing
setInterval(processQueue, 200);

// Notify queue status and fallback updates
setInterval(() => {
  const now = Date.now();
  for (const user of queue) {
    if (user.peer.isOpen()) {
      const waitTime = Math.floor((now - user.joinedAt) / 1000);
      const isFallingBack = !user.strictGender && user.preferredGender !== 'any' && (now - user.joinedAt >= 15000);
      const allUsersBusy = waitTime >= 10;
      
      try {
        user.peer.send({
          type: 'queue_status',
          queueLength: queue.length,
          waitTime,
          allUsersBusy,
          notice: allUsersBusy
            ? 'All the users are currently connected on a call. Please wait while we try connect you with any available user.'
            : undefined,
          fallbackActive: isFallingBack
        });
      } catch {
        // ignore send error
      }
    }
  }
}, 1000);

// Clean room cleanup
function leaveRoom(peer: SignalingPeer, reason = 'peer_left') {
  const roomId = peerRooms.get(peer.id);
  if (!roomId) return;

  const room = activeRooms.get(roomId);
  if (room) {
    if (room.isAiCompanion) {
      console.log(`[Matchmaking] User ${peer.id} left AI agent call (reason: ${reason}).`);
    } else if (room.user2) {
      const otherPeer = room.user1.peer.id === peer.id ? room.user2.peer : room.user1.peer;
      if (otherPeer && otherPeer.isOpen()) {
        try {
          otherPeer.send({
            type: 'peer_left',
            reason,
            duration: Math.floor((Date.now() - room.createdAt) / 1000)
          });
        } catch {
          // ignore
        }
      }
      peerRooms.delete(otherPeer.id);
    }
    activeRooms.delete(roomId);
  }
  peerRooms.delete(peer.id);
}

function removeFromQueue(peer: SignalingPeer) {
  const idx = queue.findIndex(q => q.peer.id === peer.id);
  if (idx !== -1) {
    queue.splice(idx, 1);
  }
}

// Core unified message handler for both WebSocket and HTTP-polling transports
function handleClientMessage(peer: SignalingPeer, msg: any) {
  peer.lastActive = Date.now();
  const lockedCountry = (msg.userCountry && typeof msg.userCountry === 'string' && msg.userCountry.length === 2 && msg.userCountry !== 'any') 
    ? msg.userCountry.toUpperCase() 
    : (peer.verifiedCountry?.code || 'US');

  switch (msg.type) {
    case 'ping': {
      peer.send({ type: 'pong', timestamp: Date.now() });
      break;
    }

    case 'join_queue': {
      removeFromQueue(peer);
      leaveRoom(peer, 'skipped');

      const queued: QueuedUser = {
        peer,
        id: peer.id,
        mode: msg.mode || 'voice',
        language: msg.language || 'any',
        userCountry: lockedCountry,
        preferredCountries: Array.isArray(msg.preferredCountries) ? msg.preferredCountries : [],
        restrictedCountries: Array.isArray(msg.restrictedCountries) ? msg.restrictedCountries : [],
        region: msg.region || 'any',
        tags: Array.isArray(msg.tags) ? msg.tags : [],
        userGender: msg.userGender || 'unspecified',
        preferredGender: msg.preferredGender || 'any',
        strictGender: !!msg.strictGender,
        callsign: msg.callsign || `Caller #${Math.floor(100 + Math.random() * 900)}`,
        joinedAt: Date.now(),
        roomCode: msg.roomCode ? String(msg.roomCode).trim().toLowerCase() : undefined
      };

      console.log(`[Queue] Peer ${peer.id} (${queued.callsign}) joined queue. mode: ${queued.mode}, room: ${queued.roomCode || 'public'}. Total in queue: ${queue.length + 1}`);

      queue.push(queued);
      peer.send({ type: 'queue_joined', position: queue.length });
      processQueue();
      break;
    }

    case 'sync_telemetry': {
      if (msg.timezone || msg.languages) {
        const updated = resolveCountry(peer.headers, {
          timezone: msg.timezone,
          languages: msg.languages,
        });
        peer.verifiedCountry = updated;
        peer.send({
          type: 'country_verified',
          detectedCountry: updated,
        });
      }
      break;
    }

    case 'leave_queue': {
      removeFromQueue(peer);
      peer.send({ type: 'queue_left' });
      break;
    }

    case 'signal': {
      let roomId = peerRooms.get(peer.id);
      if (!roomId && msg.roomId && activeRooms.has(msg.roomId)) {
        roomId = msg.roomId;
        const room = activeRooms.get(roomId)!;
        if (room.user1.id === peer.id || !room.user1.peer.isOpen()) {
          room.user1.id = peer.id;
          room.user1.peer = peer;
        } else {
          room.user2.id = peer.id;
          room.user2.peer = peer;
        }
        peerRooms.set(peer.id, roomId);
      }
      if (!roomId) return;
      const room = activeRooms.get(roomId);
      if (!room) return;

      const targetPeer = room.user1.peer.id === peer.id ? room.user2.peer : room.user1.peer;
      if (targetPeer && targetPeer.isOpen()) {
        targetPeer.send({
          type: 'signal',
          signal: msg.signal,
          roomId
        });
      }
      break;
    }

    case 'reassociate': {
      const { roomId, oldClientId } = msg;
      if (roomId && activeRooms.has(roomId)) {
        const room = activeRooms.get(roomId)!;
        if (oldClientId && room.user1.id === oldClientId) {
          room.user1.id = peer.id;
          room.user1.peer = peer;
          console.log(`[Signaling] Reassociated user1 in room ${roomId} from ${oldClientId} to ${peer.id}`);
        } else if (oldClientId && room.user2.id === oldClientId) {
          room.user2.id = peer.id;
          room.user2.peer = peer;
          console.log(`[Signaling] Reassociated user2 in room ${roomId} from ${oldClientId} to ${peer.id}`);
        } else {
          if (!room.user1.peer.isOpen()) {
            room.user1.id = peer.id;
            room.user1.peer = peer;
          } else if (!room.user2.peer.isOpen()) {
            room.user2.id = peer.id;
            room.user2.peer = peer;
          }
        }
        peerRooms.set(peer.id, roomId);
        if (oldClientId && oldClientId !== peer.id) peerRooms.delete(oldClientId);
        peer.send({ type: 'reassociated', roomId });
      }
      break;
    }

    case 'chat_message': {
      const roomId = peerRooms.get(peer.id);
      if (!roomId) return;
      const room = activeRooms.get(roomId);
      if (!room) return;

      if (room.isAiCompanion && room.aiPersona) {
        const persona = room.aiPersona;
        setTimeout(() => {
          if (peer.isOpen()) {
            peer.send({ type: 'typing', isTyping: true });
          }
        }, 200);

        generateAiPersonaReply(persona, msg.text || (msg.imageUrl ? 'Check out this picture I sent!' : ''), room.user1.callsign, room.user1.userCountry)
          .then(reply => {
            setTimeout(() => {
              if (peer.isOpen()) {
                peer.send({ type: 'typing', isTyping: false });
                peer.send({
                  type: 'chat_message',
                  message: {
                    id: generateId('msg'),
                    sender: 'stranger',
                    text: reply,
                    timestamp: Date.now()
                  }
                });
              }
            }, 600);
          })
          .catch(err => {
            console.warn('AI chat reply warning:', err);
            if (peer.isOpen()) {
              peer.send({ type: 'typing', isTyping: false });
            }
          });
        break;
      }

      const targetPeer = room.user1.peer.id === peer.id ? room.user2?.peer : room.user1.peer;
      if (targetPeer && targetPeer.isOpen()) {
        targetPeer.send({
          type: 'chat_message',
          message: {
            id: generateId('msg'),
            sender: 'stranger',
            text: msg.text || msg.message?.text || '',
            imageUrl: msg.imageUrl || msg.message?.imageUrl,
            timestamp: Date.now()
          }
        });
      }
      break;
    }

    case 'typing': {
      const roomId = peerRooms.get(peer.id);
      if (!roomId) return;
      const room = activeRooms.get(roomId);
      if (!room || room.isAiCompanion) return;

      const targetPeer = room.user1.peer.id === peer.id ? room.user2?.peer : room.user1.peer;
      if (targetPeer && targetPeer.isOpen()) {
        targetPeer.send({
          type: 'typing',
          isTyping: !!msg.isTyping
        });
      }
      break;
    }

    case 'friend_request': {
      const roomId = peerRooms.get(peer.id);
      if (!roomId) return;
      const room = activeRooms.get(roomId);
      if (!room) return;

      if (room.isAiCompanion && room.aiPersona) {
        peer.send({
          type: 'friend_request_received',
          senderCallsign: room.aiPersona.callsign,
          friendCode: `CALL-${Math.floor(1000 + Math.random() * 9000)}`,
          frequencyCode: `${(90 + Math.random() * 18).toFixed(1)} FM`
        });
        break;
      }

      const targetPeer = room.user1.peer.id === peer.id ? room.user2?.peer : room.user1.peer;
      if (targetPeer && targetPeer.isOpen()) {
        targetPeer.send({
          type: 'friend_request_received',
          senderCallsign: msg.callsign,
          friendCode: msg.friendCode || `USR-${Math.floor(1000 + Math.random() * 9000)}`
        });
      }
      break;
    }

    case 'skip': {
      leaveRoom(peer, 'skipped');

      if (msg.requeue) {
        const queued: QueuedUser = {
          peer,
          id: peer.id,
          mode: msg.mode || 'voice',
          language: msg.language || 'any',
          userCountry: lockedCountry,
          preferredCountries: Array.isArray(msg.preferredCountries) ? msg.preferredCountries : [],
          restrictedCountries: Array.isArray(msg.restrictedCountries) ? msg.restrictedCountries : [],
          region: msg.region || 'any',
          tags: Array.isArray(msg.tags) ? msg.tags : [],
          userGender: msg.userGender || 'unspecified',
          preferredGender: msg.preferredGender || 'any',
          strictGender: !!msg.strictGender,
          callsign: msg.callsign || `Caller #${Math.floor(100 + Math.random() * 900)}`,
          joinedAt: Date.now(),
          roomCode: msg.roomCode ? String(msg.roomCode).trim().toLowerCase() : undefined
        };
        queue.push(queued);
        peer.send({ type: 'queue_joined', position: queue.length });
        processQueue();
      }
      break;
    }

    case 'end_call': {
      leaveRoom(peer, 'ended_by_user');
      break;
    }

    case 'report_user': {
      leaveRoom(peer, 'reported');
      peer.send({ type: 'report_confirmed' });
      break;
    }

    default:
      break;
  }
}

// WebSocket Connection Handling
wss.on("connection", (ws: WebSocket, req: http.IncomingMessage) => {
  const userId = generateId('usr');

  let queryTz: string | undefined;
  let queryLangs: string[] | undefined;
  try {
    const parsedUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    queryTz = parsedUrl.searchParams.get('tz') || undefined;
    const langParam = parsedUrl.searchParams.get('lang');
    if (langParam) queryLangs = langParam.split(',');
  } catch {
    // ignore
  }

  const verifiedCountry = resolveCountry(req.headers as Record<string, string | string[] | undefined>, {
    timezone: queryTz,
    languages: queryLangs,
  });

  const peer: SignalingPeer = {
    id: userId,
    type: 'ws',
    isOpen: () => ws.readyState === WebSocket.OPEN,
    send: (payload: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
      }
    },
    headers: req.headers as Record<string, string | string[] | undefined>,
    verifiedCountry,
    lastActive: Date.now(),
  };

  allPeers.set(userId, peer);

  peer.send({
    type: 'connected',
    userId,
    detectedCountry: verifiedCountry,
    stats: {
      onlineUsers: getDisplayOnlineUsers(),
      realUsers: allPeers.size,
      activeRooms: activeRooms.size,
      totalMatches: totalMatchesMade,
    },
  });

  // Broadcast updated count (+1 for this newly connected real user) to all active users
  broadcastStats();

  ws.on("message", (data: string) => {
    try {
      const msg = JSON.parse(data.toString());
      handleClientMessage(peer, msg);
    } catch (err) {
      console.error('Error parsing WS message:', err);
    }
  });

  ws.on("close", () => {
    removeFromQueue(peer);
    leaveRoom(peer, 'disconnected');
    allPeers.delete(userId);
    // Broadcast updated count (-1 when real user disconnects) to all active users
    broadcastStats();
  });
});

// Periodic inactive HTTP peer cleanup
setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const [id, peer] of allPeers.entries()) {
    const isCallActive = peerRooms.has(id);
    const maxIdle = isCallActive ? 120000 : 45000;
    if (peer.type === 'http' && now - peer.lastActive > maxIdle) {
      removeFromQueue(peer);
      leaveRoom(peer, 'disconnected');
      allPeers.delete(id);
      changed = true;
    }
  }
  if (changed) {
    broadcastStats();
  }
}, 10000);

// API Routes
app.get("/api/room/:code", (req, res) => {
  const code = (req.params.code || '').trim().toLowerCase();
  if (!code) {
    return res.status(400).json({ error: "Invalid room code" });
  }

  const waitingUser = queue.find(u => u.roomCode && u.roomCode.toLowerCase() === code && u.peer.isOpen());
  const activeRoom = Array.from(activeRooms.values()).find(r => r.id === `room_priv_${code}` || r.id === code);

  res.json({
    status: "ok",
    roomCode: code,
    hasWaitingPeer: !!waitingUser,
    waitingCallsign: waitingUser ? waitingUser.callsign : null,
    isOccupied: !!activeRoom,
    mode: waitingUser ? waitingUser.mode : (activeRoom ? activeRoom.mode : 'voice')
  });
});

app.get("/api/detect-country", (req, res) => {
  const result = resolveCountry(req.headers as Record<string, string | string[] | undefined>);
  res.json({
    status: "ok",
    country: result,
  });
});

app.post("/api/detect-country", (req, res) => {
  const { timezone, languages } = req.body || {};
  const result = resolveCountry(req.headers as Record<string, string | string[] | undefined>, {
    timezone,
    languages,
  });
  res.json({
    status: "ok",
    country: result,
  });
});

// ==========================================
// HTTP Long-Polling Fallback Signaling Bridge
// ==========================================
app.post("/api/signal/connect", (req, res) => {
  const { timezone, languages, clientId } = req.body || {};
  const id = (clientId && typeof clientId === 'string' && allPeers.has(clientId)) ? clientId : generateId('usr_http');

  let peer = allPeers.get(id);
  const verifiedCountry = resolveCountry(req.headers as Record<string, string | string[] | undefined>, {
    timezone,
    languages,
  });

  if (!peer) {
    peer = {
      id,
      type: 'http',
      isOpen: () => {
        const p = allPeers.get(id);
        return !!p && Date.now() - p.lastActive < 35000;
      },
      httpQueue: [],
      httpResolver: null,
      httpTimeout: null,
      send: function(payload: any) {
        this.httpQueue = this.httpQueue || [];
        this.httpQueue.push(payload);
        if (this.httpResolver) {
          const resolve = this.httpResolver;
          this.httpResolver = null;
          if (this.httpTimeout) {
            clearTimeout(this.httpTimeout);
            this.httpTimeout = null;
          }
          const msgs = this.httpQueue.splice(0);
          resolve(msgs);
        }
      },
      headers: req.headers as Record<string, string | string[] | undefined>,
      verifiedCountry,
      lastActive: Date.now(),
    };
    allPeers.set(id, peer);
  } else {
    peer.lastActive = Date.now();
    peer.verifiedCountry = verifiedCountry;
  }

  res.json({
    status: "ok",
    clientId: id,
    userId: id,
    detectedCountry: verifiedCountry,
    stats: {
      onlineUsers: getDisplayOnlineUsers(),
      realUsers: allPeers.size,
      activeRooms: activeRooms.size,
      totalMatches: totalMatchesMade,
    },
  });

  // Broadcast updated count (+1 for newly connected user)
  broadcastStats();
});

app.all("/api/signal/poll", (req, res) => {
  const clientId = (req.query.clientId || req.body?.clientId) as string;
  if (!clientId) {
    return res.status(400).json({ error: "Missing clientId" });
  }

  const peer = allPeers.get(clientId);
  if (!peer) {
    return res.status(404).json({ error: "Session not found or expired" });
  }

  peer.lastActive = Date.now();

  // If there are already queued messages, return immediately
  if (peer.httpQueue && peer.httpQueue.length > 0) {
    const msgs = peer.httpQueue.splice(0);
    return res.json({ status: "ok", messages: msgs });
  }

  // Clear any existing hanging resolver
  if (peer.httpResolver) {
    const oldResolver = peer.httpResolver;
    peer.httpResolver = null;
    if (peer.httpTimeout) {
      clearTimeout(peer.httpTimeout);
      peer.httpTimeout = null;
    }
    oldResolver([]);
  }

  // Hold connection for up to 9 seconds (fast long-poll cycle)
  let resolved = false;
  const finish = (msgs: any[]) => {
    if (resolved) return;
    resolved = true;
    if (peer.httpResolver === finish) {
      peer.httpResolver = null;
    }
    if (peer.httpTimeout) {
      clearTimeout(peer.httpTimeout);
      peer.httpTimeout = null;
    }
    if (!res.headersSent) {
      res.json({ status: "ok", messages: msgs });
    }
  };

  peer.httpResolver = finish;
  peer.httpTimeout = setTimeout(() => {
    finish([]);
  }, 9000);

  req.on("close", () => {
    if (!resolved) {
      resolved = true;
      if (peer.httpResolver === finish) {
        peer.httpResolver = null;
        if (peer.httpTimeout) {
          clearTimeout(peer.httpTimeout);
          peer.httpTimeout = null;
        }
      }
    }
  });
});

app.post("/api/signal/send", (req, res) => {
  const { clientId, message, messages } = req.body || {};
  if (!clientId || (!message && (!messages || !Array.isArray(messages)))) {
    return res.status(400).json({ error: "Missing clientId or message" });
  }

  const peer = allPeers.get(clientId);
  if (!peer) {
    return res.status(404).json({ error: "Session not found" });
  }

  peer.lastActive = Date.now();
  if (Array.isArray(messages)) {
    for (const m of messages) {
      if (m) handleClientMessage(peer, m);
    }
  } else if (message) {
    handleClientMessage(peer, message);
  }
  res.json({ status: "ok" });
});

app.post("/api/signal/disconnect", (req, res) => {
  const { clientId } = req.body || {};
  if (clientId) {
    const peer = allPeers.get(clientId);
    if (peer) {
      removeFromQueue(peer);
      leaveRoom(peer, 'disconnected');
      allPeers.delete(clientId);
      broadcastStats();
    }
  }
  res.json({ status: "ok" });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    onlineUsers: getDisplayOnlineUsers(),
    realUsers: allPeers.size,
    queueLength: queue.length,
    activeRooms: activeRooms.size,
    totalMatches: totalMatchesMade
  });
});

app.get("/api/ai-companion/personas", (req, res) => {
  res.json({
    personas: AI_FEMALE_PERSONAS,
    total: AI_FEMALE_PERSONAS.length
  });
});

app.post("/api/ai-companion/chat", async (req, res) => {
  try {
    const { personaId, history, userMessage, userCallsign, userCountry } = req.body || {};
    const persona = getAiPersonaById(personaId) || getRandomAiPersona();
    const reply = await generateAiPersonaReply(
      persona,
      userMessage || "Hello!",
      userCallsign || "Caller",
      userCountry || "US",
      history || []
    );

    res.json({ reply, persona });
  } catch (err: any) {
    console.error("Error in /api/ai-companion/chat:", err);
    res.status(500).json({ error: "Failed to generate reply", reply: "That's great! What else are you up to today?" });
  }
});

app.post("/api/ai-companion/speak", async (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/stats", (req, res) => {
  res.json({
    onlineUsers: getDisplayOnlineUsers(),
    realUsers: allPeers.size,
    activeRooms: activeRooms.size,
    totalMatches: totalMatchesMade,
    serverTime: new Date().toISOString()
  });
});

// ==========================================
// WEBSITE ANALYTICS & OWNER DASHBOARD ROUTES
// ==========================================

// 1. Silent Visitor Heartbeat / Ping
app.post("/api/analytics/ping", (req, res) => {
  try {
    let payload = req.body;
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch {
        payload = {};
      }
    }
    const {
      sessionId,
      visitorId,
      durationSeconds,
      callsJoined,
      textChats,
      timezone,
      languages,
      clientCountry,
      region,
      city,
      referrer,
      landingPath,
    } = payload || {};

    const clientTelemetry = {
      timezone: timezone || (req.headers["x-timezone"] as string),
      languages: languages || (req.headers["accept-language"] ? [req.headers["accept-language"] as string] : []),
    };

    const verified = resolveCountry(req.headers, clientTelemetry);
    const countryCode = clientCountry || verified.code || "US";
    const countryName = verified.name || getCountryName(countryCode);
    const countryFlag = verified.flag || getCountryFlag(countryCode);

    const ua = (req.headers["user-agent"] as string) || "";
    const { device, browser, os } = parseUserAgent(ua);

    const detectedRegion =
      region ||
      (req.headers["cf-ipcity"] as string) ||
      (req.headers["x-client-geo-location-city"] as string) ||
      (req.headers["x-appengine-city"] as string) ||
      timezone?.split("/")[1]?.replace(/_/g, " ") ||
      "General";

    const session = analyticsManager.recordPing({
      sessionId: sessionId || generateId("sess"),
      visitorId: visitorId || generateId("vis"),
      durationSeconds: Number(durationSeconds) || 1,
      callsJoined: Number(callsJoined) || 0,
      textChats: Number(textChats) || 0,
      countryCode,
      countryName,
      countryFlag,
      region: detectedRegion,
      city: city || detectedRegion,
      device,
      browser,
      os,
      referrer: referrer || "Direct / Bookmark",
      landingPath: landingPath || "/",
      ip: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1",
    });

    res.json({
      status: "ok",
      onlineUsers: getDisplayOnlineUsers(),
      sessionId: session.id,
    });
  } catch (err: any) {
    console.error("Error in /api/analytics/ping:", err);
    res.json({ status: "ok" });
  }
});

// 2. Owner Auth / Login
app.post("/api/admin/auth", (req, res) => {
  const { password } = req.body || {};
  const result = analyticsManager.authenticate(password);
  if (result.success) {
    res.json({ success: true, token: result.token });
  } else {
    res.status(401).json({ success: false, message: "Invalid Owner Passcode" });
  }
});

// 3. Change Owner Password
app.post("/api/admin/change-password", (req, res) => {
  const token = (req.headers["authorization"] || "").replace("Bearer ", "") || (req.headers["x-owner-token"] as string);
  if (!analyticsManager.verifyToken(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { oldPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: "New passcode must be at least 4 characters" });
  }
  const ok = analyticsManager.updatePassword(oldPassword, newPassword);
  if (ok) {
    res.json({ success: true, message: "Passcode updated successfully" });
  } else {
    res.status(400).json({ error: "Incorrect current passcode" });
  }
});

// 4. Owner Analytics Summary with Custom Period / Date Filtering
app.get("/api/admin/analytics", (req, res) => {
  const token = (req.headers["authorization"] || "").replace("Bearer ", "") || (req.headers["x-owner-token"] as string);
  if (!analyticsManager.verifyToken(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { period, startDate, endDate, country, minDuration } = req.query;
  const summary = analyticsManager.getSummary({
    period: (period as any) || "today",
    startDate: startDate as string,
    endDate: endDate as string,
    country: country as string,
    minDuration: minDuration ? Number(minDuration) : undefined,
  });
  res.json(summary);
});

// 5. Owner Data Export (CSV & JSON)
app.get("/api/admin/export", (req, res) => {
  const token = (req.headers["authorization"] || "").replace("Bearer ", "") || (req.headers["x-owner-token"] as string) || (req.query.token as string);
  if (!analyticsManager.verifyToken(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { period, startDate, endDate, format } = req.query;
  const summary = analyticsManager.getSummary({
    period: (period as any) || "last_30_days",
    startDate: startDate as string,
    endDate: endDate as string,
  });

  if (format === "json") {
    res.setHeader("Content-Disposition", `attachment; filename=quiktalks-analytics-${period || "export"}.json`);
    res.setHeader("Content-Type", "application/json");
    return res.send(JSON.stringify(summary, null, 2));
  }

  // CSV format
  const rows = [
    ["Session ID", "Visitor ID", "Start Time", "Duration (seconds)", "Duration (formatted)", "Country", "Country Code", "Region", "City", "Device", "Browser", "OS", "Referrer", "Calls Joined", "Status"],
    ...summary.recentSessions.map(s => [
      s.id,
      s.visitorId,
      new Date(s.startTime).toISOString(),
      s.durationSeconds,
      `"${Math.floor(s.durationSeconds / 60)}m ${s.durationSeconds % 60}s"`,
      `"${s.countryName}"`,
      s.countryCode,
      `"${s.region}"`,
      `"${s.city}"`,
      s.device,
      s.browser,
      s.os,
      `"${s.referrer}"`,
      s.callsJoined,
      s.isOnline ? "Online" : "Ended"
    ])
  ];

  const csvContent = rows.map(r => r.join(",")).join("\n");
  res.setHeader("Content-Disposition", `attachment; filename=quiktalks-analytics-${period || "export"}.csv`);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.send(csvContent);
});

// Xirsys Dynamic TURN Credentials Cache
let xirsysCachedServers: any[] | null = null;
let xirsysCacheExpiresAt = 0;

/**
 * Extracts the embedded Unix timestamp from a Xirsys dynamic username token
 * to verify if the token is valid or expired before returning it to WebRTC peers.
 */
function isXirsysTokenValid(username: string): boolean {
  if (!username) return false;
  try {
    const buf = Buffer.from(username, "base64");
    const nameIdx = buf.indexOf("irfanhhashmi");
    if (nameIdx >= 4) {
      const expTs = buf.readUInt32BE(nameIdx - 4);
      const nowSec = Math.floor(Date.now() / 1000);
      // Valid only if expiration is in the future with at least 120s buffer
      return expTs > (nowSec + 120);
    }
  } catch {}
  return true;
}

async function getXirsysServers(forceRefresh = false): Promise<any[]> {
  const now = Date.now();
  if (!forceRefresh && xirsysCachedServers && now < xirsysCacheExpiresAt) {
    const turnServer = xirsysCachedServers.find((s) => s.username);
    if (!turnServer || isXirsysTokenValid(turnServer.username)) {
      return xirsysCachedServers;
    }
    console.log("[Xirsys] Cached token expired or invalid, refreshing immediately...");
  }

  try {
    const auth = Buffer.from("irfanhhashmi:336c48ca-abae-11f1-be72-6e258a7f39cd").toString("base64");
    // Request maximum 24-hour (86400 seconds) token validity so TURN allocations never expire during calls
    const response = await fetch("https://global.xirsys.net/_turn/QuikTalks?webrtc=1&expire=86400", {
      method: "PUT",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expire: 86400 }),
    });

    if (response.ok) {
      const data: any = await response.json();
      if (data && data.v && Array.isArray(data.v.iceServers) && data.v.iceServers.length > 0) {
        const rawServer = data.v.iceServers[0];
        // Standard high-performance WebRTC endpoints (clean UDP, TCP, and TLS 443)
        // Avoid port 80 (blocked by HTTP proxies) and port 5349 (redundant with 443) to prevent ICE error spam
        const prioritizedUrls = [
          "turns:hk-turn1.xirsys.com:443?transport=tcp",
          "turn:hk-turn1.xirsys.com:3478?transport=tcp",
          "turn:hk-turn1.xirsys.com:3478?transport=udp",
        ];

        xirsysCachedServers = [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:stun1.l.google.com:19302",
              "stun:stun.cloudflare.com:3478",
            ],
          },
          {
            urls: prioritizedUrls,
            username: rawServer.username,
            credential: rawServer.credential,
          },
        ];
        // Cache for 30 minutes on server (well within the 24-hour token lifetime)
        xirsysCacheExpiresAt = now + 30 * 60 * 1000;
        console.log("[Xirsys] Generated fresh 24-hour dynamic TURN credentials for QuikTalks successfully");
        return xirsysCachedServers;
      }
    }
  } catch (err) {
    console.warn("[Xirsys] Error fetching dynamic credentials from Xirsys API:", err);
  }

  // Fallback if API call fails
  return [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun.cloudflare.com:3478",
      ],
    }
  ];
}

// Xirsys TURN Credentials Endpoint (Xirsys Dynamic ONLY)
app.get("/api/turn-servers", async (req, res) => {
  // CRITICAL: Prevent Cloudflare, browser disk cache, or proxies from caching dynamic credentials
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  try {
    const forceRefresh = req.query.refresh === "true";
    const servers = await getXirsysServers(forceRefresh);
    res.json({ iceServers: servers });
  } catch (e) {
    res.status(500).json({ error: "Failed to load ICE servers" });
  }
});

// Global process safeguards to prevent unexpected process exit from unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.warn("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

async function startServer() {
  server.on("error", (err: any) => {
    console.error("HTTP/WebSocket server error:", err);
    if (err.code === "EADDRINUSE") {
      console.error("Port 3000 is already in use. Exiting for clean restart.");
      process.exit(1);
    }
  });

  try {
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    const portToListen = process.env.PORT || PORT;
    server.listen(portToListen, () => {
      console.log(`Server running on port/socket ${portToListen}`);
      console.log(`VoiceTalk Server is broadcasting`);
    });
  } catch (err) {
    console.error("Critical error during server initialization:", err);
    process.exit(1);
  }
}

startServer();
