export type ChatMode = 'voice' | 'text';

export type UserGender = 'male' | 'female' | 'non-binary' | 'unspecified';
export type PreferredGender = 'any' | 'female' | 'male' | 'non-binary';

export interface MatchPreferences {
  mode: ChatMode;
  language: string;
  userCountry: string; // The user's home country code, e.g. 'US' or 'auto'
  preferredCountries: string[]; // Countries to prioritize matching with
  restrictedCountries: string[]; // Countries to completely exclude/block
  region?: string; // Backwards-compatible
  tags: string[];
  userGender: UserGender;
  preferredGender: PreferredGender;
  strictGender: boolean;
  autoCall: boolean;
  allowAi?: boolean;
  roomCode?: string; // Private Room / Direct Invite Code
}

export interface SharedRoomInfo {
  roomCode: string;
  mode: ChatMode;
  creatorCallsign?: string;
  createdAt: number;
}

export type ConnectionState = 'idle' | 'queueing' | 'connecting' | 'connected' | 'ended';

export interface PeerInfo {
  id: string;
  gender?: UserGender;
  language?: string;
  country?: string;
  region?: string;
  tags: string[];
  callsign?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'you' | 'stranger' | 'system';
  text: string;
  imageUrl?: string;
  imageCaption?: string;
  timestamp: number;
}

export interface MutualFriend {
  id: string;
  callsign: string;
  country?: string;
  tags: string[];
  addedAt: number;
  lastCallDuration: number;
  friendCode: string;
  frequencyCode?: string;
}

export interface CallLog {
  id: string;
  peerId: string;
  callsign: string;
  mode: ChatMode;
  duration: number; // duration in seconds
  timestamp: number; // epoch ms
  tags: string[];
  language?: string;
  country?: string;
  region?: string;
  endedReason: 'completed' | 'skipped' | 'peer_left' | 'hung_up';
}

export interface UserProfile {
  callsign: string;
  bio: string;
  avatarSeed: string;
}

export interface ReportPayload {
  reason: 'harassment' | 'inappropriate' | 'spam' | 'underage' | 'other';
  details?: string;
  reportedPeerId: string;
}
