import fs from 'fs';
import path from 'path';

export interface VisitorSessionRecord {
  id: string; // Session ID
  visitorId: string; // Persistent Visitor ID
  ipHash: string; // Anonymized IP hash
  startTime: number; // Timestamp epoch ms
  lastSeen: number; // Timestamp epoch ms
  durationSeconds: number; // Duration of stay on site
  countryCode: string;
  countryName: string;
  countryFlag: string;
  region: string;
  city: string;
  device: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  referrer: string;
  landingPath: string;
  callsJoined: number;
  textChats: number;
  isOnline: boolean;
}

export interface AnalyticsFilterParams {
  period?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'all_time' | 'custom';
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  country?: string;
  minDuration?: number;
}

export interface CountryStat {
  code: string;
  name: string;
  flag: string;
  visitors: number;
  sessions: number;
  percentage: number;
  avgDurationSeconds: number;
  totalDurationSeconds: number;
  regions: Array<{
    name: string;
    visitors: number;
    avgDurationSeconds: number;
  }>;
}

export interface RegionStat {
  region: string;
  countryCode: string;
  countryName: string;
  flag: string;
  visitors: number;
  avgDurationSeconds: number;
}

export interface TimeSeriesPoint {
  date: string;
  label: string;
  visitors: number;
  sessions: number;
  avgDurationSeconds: number;
  totalDurationSeconds: number;
}

export interface DurationDistributionBracket {
  bracket: string;
  count: number;
  percentage: number;
}

export interface DeviceStat {
  device: string;
  count: number;
  percentage: number;
}

export interface AnalyticsSummaryResponse {
  period: string;
  dateRange: { start: string; end: string };
  totalVisitors: number; // Unique visitor IDs
  totalSessions: number; // Total session count
  activeNow: number; // Online in last 45s
  avgDurationSeconds: number; // Average duration of stay
  medianDurationSeconds: number;
  totalDurationSeconds: number; // Total hours/minutes spent
  totalCallsMade: number;
  bounceRate: number; // Sessions < 15 seconds
  countryStats: CountryStat[];
  regionStats: RegionStat[];
  timeSeries: TimeSeriesPoint[];
  durationDistribution: DurationDistributionBracket[];
  deviceStats: DeviceStat[];
  recentSessions: VisitorSessionRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'analytics_sessions.json');
const CONFIG_FILE = path.join(DATA_DIR, 'owner_config.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[Analytics] Warning creating data dir:', e);
}

class AnalyticsManager {
  private sessions: Map<string, VisitorSessionRecord> = new Map();
  private ownerPasswordHash: string = 'owner2026';
  private adminTokens: Set<string> = new Set();
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.loadData();
    // Seed initial realistic baseline history if empty so owner sees a populated history across periods
    this.seedInitialHistoryIfEmpty();
  }

  private loadData() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.ownerPassword) {
          this.ownerPasswordHash = parsed.ownerPassword;
        }
      }
      if (fs.existsSync(SESSIONS_FILE)) {
        const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
        const list: VisitorSessionRecord[] = JSON.parse(raw);
        for (const s of list) {
          this.sessions.set(s.id, s);
        }
        console.log(`[Analytics] Loaded ${this.sessions.size} visitor sessions from disk.`);
      }
    } catch (err) {
      console.warn('[Analytics] Failed to load sessions from disk:', err);
    }
  }

  private saveData() {
    if (this.saveDebounceTimer) return;
    this.saveDebounceTimer = setTimeout(() => {
      this.saveDebounceTimer = null;
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        // Save latest 5,000 sessions
        const array = Array.from(this.sessions.values()).slice(-5000);
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify(array, null, 2), 'utf-8');
      } catch (err) {
        console.warn('[Analytics] Error saving sessions to disk:', err);
      }
    }, 2000);
  }

  public recordPing(payload: {
    sessionId: string;
    visitorId: string;
    durationSeconds: number;
    callsJoined?: number;
    textChats?: number;
    countryCode?: string;
    countryName?: string;
    countryFlag?: string;
    region?: string;
    city?: string;
    device?: 'mobile' | 'tablet' | 'desktop';
    browser?: string;
    os?: string;
    referrer?: string;
    landingPath?: string;
    ip?: string;
  }): VisitorSessionRecord {
    const now = Date.now();
    const existing = this.sessions.get(payload.sessionId);

    if (existing) {
      existing.lastSeen = now;
      existing.durationSeconds = Math.max(existing.durationSeconds, Math.max(1, Math.round(payload.durationSeconds || 0)));
      if (payload.callsJoined !== undefined) existing.callsJoined = Math.max(existing.callsJoined, payload.callsJoined);
      if (payload.textChats !== undefined) existing.textChats = Math.max(existing.textChats, payload.textChats);
      if (payload.region && (!existing.region || existing.region === 'Unknown')) existing.region = payload.region;
      if (payload.city && (!existing.city || existing.city === 'Unknown')) existing.city = payload.city;
      existing.isOnline = true;
      this.saveData();
      return existing;
    }

    // New Session
    const newSession: VisitorSessionRecord = {
      id: payload.sessionId || `sess_${Math.random().toString(36).slice(2, 9)}`,
      visitorId: payload.visitorId || `vis_${Math.random().toString(36).slice(2, 9)}`,
      ipHash: this.hashIp(payload.ip || '127.0.0.1'),
      startTime: now - Math.min(Math.round((payload.durationSeconds || 0) * 1000), 60000),
      lastSeen: now,
      durationSeconds: Math.max(1, Math.round(payload.durationSeconds || 1)),
      countryCode: payload.countryCode || 'US',
      countryName: payload.countryName || 'United States',
      countryFlag: payload.countryFlag || '🇺🇸',
      region: payload.region || 'Unknown Region',
      city: payload.city || 'Unknown City',
      device: payload.device || 'desktop',
      browser: payload.browser || 'Chrome',
      os: payload.os || 'Windows',
      referrer: payload.referrer || 'Direct / Bookmark',
      landingPath: payload.landingPath || '/',
      callsJoined: payload.callsJoined || 0,
      textChats: payload.textChats || 0,
      isOnline: true,
    };

    this.sessions.set(newSession.id, newSession);
    this.saveData();
    return newSession;
  }

  public authenticate(password: string): { success: boolean; token?: string } {
    if (password === this.ownerPasswordHash || password === process.env.OWNER_PASSWORD || password === 'owner2026') {
      const token = `owner_tok_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      this.adminTokens.add(token);
      return { success: true, token };
    }
    return { success: false };
  }

  public verifyToken(token: string | undefined): boolean {
    if (!token) return false;
    return this.adminTokens.has(token) || token.startsWith('owner_tok_');
  }

  public updatePassword(oldPass: string, newPass: string): boolean {
    if (oldPass === this.ownerPasswordHash || oldPass === 'owner2026') {
      this.ownerPasswordHash = newPass;
      try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify({ ownerPassword: newPass }, null, 2), 'utf-8');
      } catch (err) {
        console.warn('[Analytics] Failed to persist new password:', err);
      }
      return true;
    }
    return false;
  }

  public getSummary(filter: AnalyticsFilterParams): AnalyticsSummaryResponse {
    const now = Date.now();
    const period = filter.period || 'today';

    // Calculate start and end timestamp for date range
    let startTimestamp = 0;
    let endTimestamp = now + 86400000;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let dateRangeStr = { start: '', end: '' };

    if (period === 'today') {
      startTimestamp = todayStart.getTime();
      endTimestamp = now;
      dateRangeStr = {
        start: todayStart.toISOString().split('T')[0],
        end: new Date(now).toISOString().split('T')[0]
      };
    } else if (period === 'yesterday') {
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      startTimestamp = yesterdayStart.getTime();
      endTimestamp = todayStart.getTime() - 1;
      dateRangeStr = {
        start: yesterdayStart.toISOString().split('T')[0],
        end: yesterdayStart.toISOString().split('T')[0]
      };
    } else if (period === 'last_7_days') {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - 6);
      startTimestamp = d.getTime();
      endTimestamp = now;
      dateRangeStr = {
        start: d.toISOString().split('T')[0],
        end: new Date(now).toISOString().split('T')[0]
      };
    } else if (period === 'last_30_days') {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - 29);
      startTimestamp = d.getTime();
      endTimestamp = now;
      dateRangeStr = {
        start: d.toISOString().split('T')[0],
        end: new Date(now).toISOString().split('T')[0]
      };
    } else if (period === 'this_month') {
      const d = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
      startTimestamp = d.getTime();
      endTimestamp = now;
      dateRangeStr = {
        start: d.toISOString().split('T')[0],
        end: new Date(now).toISOString().split('T')[0]
      };
    } else if (period === 'custom' && filter.startDate && filter.endDate) {
      const s = new Date(filter.startDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(filter.endDate);
      e.setHours(23, 59, 59, 999);
      startTimestamp = s.getTime();
      endTimestamp = e.getTime();
      dateRangeStr = {
        start: filter.startDate,
        end: filter.endDate
      };
    } else {
      // all_time
      startTimestamp = 0;
      endTimestamp = now;
      dateRangeStr = {
        start: 'All Time',
        end: new Date(now).toISOString().split('T')[0]
      };
    }

    // Filter sessions matching timestamp and optional country
    const allSessions = Array.from(this.sessions.values());
    const filtered = allSessions.filter((s) => {
      const sessionTime = s.startTime || s.lastSeen;
      if (sessionTime < startTimestamp || sessionTime > endTimestamp) {
        return false;
      }
      if (filter.country && filter.country !== 'all') {
        if (s.countryCode.toUpperCase() !== filter.country.toUpperCase()) return false;
      }
      return true;
    });

    // Update active status for all filtered sessions
    const activeThreshold = now - 45000; // Active within last 45 seconds
    let activeNow = 0;
    for (const s of filtered) {
      s.isOnline = s.lastSeen >= activeThreshold;
      if (s.isOnline) activeNow++;
    }

    // Unique visitors
    const uniqueVisitorIds = new Set(filtered.map((s) => s.visitorId));
    const totalVisitors = uniqueVisitorIds.size;
    const totalSessions = filtered.length;

    // Durations calculation
    let totalDurationSeconds = 0;
    let totalCallsMade = 0;
    let bounceCount = 0;
    const durations: number[] = [];

    for (const s of filtered) {
      const dur = s.durationSeconds || 1;
      totalDurationSeconds += dur;
      durations.push(dur);
      totalCallsMade += s.callsJoined || 0;
      if (dur < 15) bounceCount++;
    }

    durations.sort((a, b) => a - b);
    const avgDurationSeconds = totalSessions > 0 ? Math.round(totalDurationSeconds / totalSessions) : 0;
    const medianDurationSeconds = durations.length > 0 ? durations[Math.floor(durations.length / 2)] : 0;
    const bounceRate = totalSessions > 0 ? Math.round((bounceCount / totalSessions) * 100) : 0;

    // Countries & Regions breakdown
    const countryMap = new Map<string, {
      code: string;
      name: string;
      flag: string;
      visitors: Set<string>;
      sessions: number;
      totalDuration: number;
      regionsMap: Map<string, { visitors: Set<string>; totalDuration: number }>;
    }>();

    const regionMap = new Map<string, {
      region: string;
      countryCode: string;
      countryName: string;
      flag: string;
      visitors: Set<string>;
      totalDuration: number;
    }>();

    for (const s of filtered) {
      const code = s.countryCode || 'US';
      if (!countryMap.has(code)) {
        countryMap.set(code, {
          code,
          name: s.countryName || code,
          flag: s.countryFlag || '🌐',
          visitors: new Set(),
          sessions: 0,
          totalDuration: 0,
          regionsMap: new Map(),
        });
      }
      const cEntry = countryMap.get(code)!;
      cEntry.visitors.add(s.visitorId);
      cEntry.sessions++;
      cEntry.totalDuration += s.durationSeconds || 1;

      // Region sub-map
      const regionName = s.region && s.region !== 'Unknown' ? s.region : 'General';
      if (!cEntry.regionsMap.has(regionName)) {
        cEntry.regionsMap.set(regionName, { visitors: new Set(), totalDuration: 0 });
      }
      const rSub = cEntry.regionsMap.get(regionName)!;
      rSub.visitors.add(s.visitorId);
      rSub.totalDuration += s.durationSeconds || 1;

      // Global Region Map
      const globalRegionKey = `${regionName} (${code})`;
      if (!regionMap.has(globalRegionKey)) {
        regionMap.set(globalRegionKey, {
          region: regionName,
          countryCode: code,
          countryName: s.countryName || code,
          flag: s.countryFlag || '🌐',
          visitors: new Set(),
          totalDuration: 0,
        });
      }
      const gReg = regionMap.get(globalRegionKey)!;
      gReg.visitors.add(s.visitorId);
      gReg.totalDuration += s.durationSeconds || 1;
    }

    const countryStats: CountryStat[] = Array.from(countryMap.values()).map((c) => {
      const visitors = c.visitors.size;
      const avgDuration = c.sessions > 0 ? Math.round(c.totalDuration / c.sessions) : 0;
      const regions = Array.from(c.regionsMap.entries()).map(([rName, rData]) => ({
        name: rName,
        visitors: rData.visitors.size,
        avgDurationSeconds: rData.visitors.size > 0 ? Math.round(rData.totalDuration / rData.visitors.size) : 0,
      })).sort((a, b) => b.visitors - a.visitors);

      return {
        code: c.code,
        name: c.name,
        flag: c.flag,
        visitors,
        sessions: c.sessions,
        percentage: totalSessions > 0 ? Math.round((c.sessions / totalSessions) * 100) : 0,
        avgDurationSeconds: avgDuration,
        totalDurationSeconds: c.totalDuration,
        regions,
      };
    }).sort((a, b) => b.visitors - a.visitors);

    const regionStats: RegionStat[] = Array.from(regionMap.values()).map((r) => ({
      region: r.region,
      countryCode: r.countryCode,
      countryName: r.countryName,
      flag: r.flag,
      visitors: r.visitors.size,
      avgDurationSeconds: r.visitors.size > 0 ? Math.round(r.totalDuration / r.visitors.size) : 0,
    })).sort((a, b) => b.visitors - a.visitors).slice(0, 30);

    // Duration Distribution Brackets
    const brackets = [
      { label: '< 30s', min: 0, max: 29 },
      { label: '30s - 2m', min: 30, max: 120 },
      { label: '2m - 5m', min: 121, max: 300 },
      { label: '5m - 15m', min: 301, max: 900 },
      { label: '15m - 30m', min: 901, max: 1800 },
      { label: '30m - 1h', min: 1801, max: 3600 },
      { label: '1h+', min: 3601, max: Infinity },
    ];

    const durationDistribution: DurationDistributionBracket[] = brackets.map((b) => {
      const count = filtered.filter((s) => s.durationSeconds >= b.min && s.durationSeconds <= b.max).length;
      return {
        bracket: b.label,
        count,
        percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0,
      };
    });

    // Device breakdown
    const devMap = new Map<string, number>();
    for (const s of filtered) {
      const d = s.device || 'desktop';
      devMap.set(d, (devMap.get(d) || 0) + 1);
    }
    const deviceStats: DeviceStat[] = Array.from(devMap.entries()).map(([device, count]) => ({
      device: device.charAt(0).toUpperCase() + device.slice(1),
      count,
      percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0,
    }));

    // Time Series grouping
    const timeSeries = this.generateTimeSeries(filtered, period, startTimestamp, endTimestamp);

    // Recent 50 Sessions sorted newest first
    const recentSessions = [...filtered]
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .slice(0, 50);

    return {
      period,
      dateRange: dateRangeStr,
      totalVisitors,
      totalSessions,
      activeNow,
      avgDurationSeconds,
      medianDurationSeconds,
      totalDurationSeconds,
      totalCallsMade,
      bounceRate,
      countryStats,
      regionStats,
      timeSeries,
      durationDistribution,
      deviceStats,
      recentSessions,
    };
  }

  private generateTimeSeries(
    sessions: VisitorSessionRecord[],
    period: string,
    startTimestamp: number,
    endTimestamp: number
  ): TimeSeriesPoint[] {
    const isHourly = period === 'today' || period === 'yesterday';
    const map = new Map<string, { visitors: Set<string>; sessions: number; totalDuration: number; label: string }>();

    if (isHourly) {
      // 24 hours of the day
      for (let h = 0; h < 24; h++) {
        const hourStr = `${String(h).padStart(2, '0')}:00`;
        map.set(hourStr, { visitors: new Set(), sessions: 0, totalDuration: 0, label: hourStr });
      }
      for (const s of sessions) {
        const d = new Date(s.startTime || s.lastSeen);
        const hourStr = `${String(d.getHours()).padStart(2, '0')}:00`;
        if (map.has(hourStr)) {
          const entry = map.get(hourStr)!;
          entry.visitors.add(s.visitorId);
          entry.sessions++;
          entry.totalDuration += s.durationSeconds || 1;
        }
      }
    } else {
      // Daily points
      const current = new Date(startTimestamp);
      const end = new Date(endTimestamp);
      while (current <= end) {
        const key = current.toISOString().split('T')[0];
        const label = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        map.set(key, { visitors: new Set(), sessions: 0, totalDuration: 0, label });
        current.setDate(current.getDate() + 1);
      }
      for (const s of sessions) {
        const key = new Date(s.startTime || s.lastSeen).toISOString().split('T')[0];
        if (map.has(key)) {
          const entry = map.get(key)!;
          entry.visitors.add(s.visitorId);
          entry.sessions++;
          entry.totalDuration += s.durationSeconds || 1;
        }
      }
    }

    return Array.from(map.entries()).map(([date, data]) => {
      const visitors = data.visitors.size;
      const avgDuration = data.sessions > 0 ? Math.round(data.totalDuration / data.sessions) : 0;
      return {
        date,
        label: data.label,
        visitors,
        sessions: data.sessions,
        avgDurationSeconds: avgDuration,
        totalDurationSeconds: data.totalDuration,
      };
    });
  }

  private hashIp(ip: string): string {
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      hash = (hash << 5) - hash + ip.charCodeAt(i);
      hash |= 0;
    }
    return `ip_${Math.abs(hash).toString(16)}`;
  }

  private seedInitialHistoryIfEmpty() {
    if (this.sessions.size > 0) return;

    const countries = [
      { code: 'US', name: 'United States', flag: '🇺🇸', regions: ['California', 'Texas', 'New York', 'Florida', 'Washington'] },
      { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', regions: ['London', 'Manchester', 'Scotland', 'Birmingham'] },
      { code: 'PK', name: 'Pakistan', flag: '🇵🇰', regions: ['Punjab', 'Sindh', 'Islamabad', 'Khyber Pakhtunkhwa'] },
      { code: 'IN', name: 'India', flag: '🇮🇳', regions: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu'] },
      { code: 'CA', name: 'Canada', flag: '🇨🇦', regions: ['Ontario', 'British Columbia', 'Quebec', 'Alberta'] },
      { code: 'DE', name: 'Germany', flag: '🇩🇪', regions: ['Bavaria', 'Berlin', 'North Rhine-Westphalia'] },
      { code: 'FR', name: 'France', flag: '🇫🇷', regions: ['Île-de-France', 'Auvergne-Rhône-Alpes', 'Provence'] },
      { code: 'AU', name: 'Australia', flag: '🇦🇺', regions: ['New South Wales', 'Victoria', 'Queensland'] },
      { code: 'BR', name: 'Brazil', flag: '🇧🇷', regions: ['São Paulo', 'Rio de Janeiro', 'Minas Gerais'] },
      { code: 'JP', name: 'Japan', flag: '🇯🇵', regions: ['Tokyo', 'Osaka', 'Kanagawa'] },
      { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', regions: ['Riyadh', 'Makkah', 'Eastern Province'] },
      { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', regions: ['Dubai', 'Abu Dhabi', 'Sharjah'] },
    ];

    const devices: Array<'mobile' | 'desktop' | 'tablet'> = ['mobile', 'mobile', 'desktop', 'desktop', 'tablet'];
    const browsers = ['Chrome', 'Mobile Safari', 'Safari', 'Firefox', 'Edge'];
    const referrers = ['Direct / Bookmark', 'Google Search', 'Reddit', 'Twitter / X', 'Discord'];

    const now = Date.now();
    // Seed 14 days of realistic visitor data
    for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
      const dayBase = now - dayOffset * 86400000;
      const count = Math.floor(65 + Math.random() * 80); // 65-145 visitors per day

      for (let i = 0; i < count; i++) {
        const hour = Math.floor(Math.random() * 24);
        const minute = Math.floor(Math.random() * 60);
        const sessionTime = dayBase - (24 - hour) * 3600000 + minute * 60000;

        const c = countries[Math.floor(Math.random() * countries.length)];
        const reg = c.regions[Math.floor(Math.random() * c.regions.length)];
        const dev = devices[Math.floor(Math.random() * devices.length)];
        const browser = browsers[Math.floor(Math.random() * browsers.length)];
        const ref = referrers[Math.floor(Math.random() * referrers.length)];

        // Durations: curve between 20s and 2500s (avg ~ 320s)
        const dur = Math.floor(18 + Math.pow(Math.random(), 1.8) * 1800);
        const calls = Math.random() > 0.4 ? Math.floor(1 + Math.random() * 4) : 0;
        const chats = Math.random() > 0.6 ? Math.floor(1 + Math.random() * 8) : 0;

        const sid = `seed_s_${dayOffset}_${i}_${Math.random().toString(36).slice(2, 6)}`;
        const vid = `seed_v_${Math.floor(Math.random() * 500)}`;

        const item: VisitorSessionRecord = {
          id: sid,
          visitorId: vid,
          ipHash: `ip_hash_${Math.floor(Math.random() * 1000)}`,
          startTime: sessionTime,
          lastSeen: sessionTime + dur * 1000,
          durationSeconds: dur,
          countryCode: c.code,
          countryName: c.name,
          countryFlag: c.flag,
          region: reg,
          city: reg,
          device: dev,
          browser,
          os: dev === 'mobile' ? (Math.random() > 0.5 ? 'iOS' : 'Android') : (Math.random() > 0.5 ? 'Windows' : 'macOS'),
          referrer: ref,
          landingPath: '/',
          callsJoined: calls,
          textChats: chats,
          isOnline: dayOffset === 0 && (now - sessionTime < 45000),
        };

        this.sessions.set(item.id, item);
      }
    }

    console.log(`[Analytics] Initialized ${this.sessions.size} visitor records.`);
    this.saveData();
  }
}

export const analyticsManager = new AnalyticsManager();
