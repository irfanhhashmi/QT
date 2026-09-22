import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3,
  Globe2,
  Clock,
  Users,
  ShieldCheck,
  Download,
  RefreshCw,
  X,
  Lock,
  Search,
  Calendar,
  Smartphone,
  Monitor,
  Tablet,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Flame,
  KeyRound,
  LogOut,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  AnalyticsSummaryResponse,
  CountryStat,
  RegionStat,
  TimeSeriesPoint,
  VisitorSessionRecord,
} from '../server/analytics';

interface OwnerAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'geo' | 'duration' | 'live_visitors' | 'settings';
type PeriodType = 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'all_time' | 'custom';

// Helper: Format seconds to readable string
function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

function formatTotalHours(seconds: number): string {
  if (seconds < 3600) {
    return `${(seconds / 60).toFixed(1)} mins`;
  }
  return `${(seconds / 3600).toFixed(1)} hrs`;
}

export const OwnerAnalyticsModal: React.FC<OwnerAnalyticsModalProps> = ({ isOpen, onClose }) => {
  // Auth state
  const [authToken, setAuthToken] = useState<string>(() => {
    return localStorage.getItem('quiktalks_owner_token') || sessionStorage.getItem('quiktalks_owner_token') || '';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Tab & Filter states
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [period, setPeriod] = useState<PeriodType>('last_7_days');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data state
  const [summary, setSummary] = useState<AnalyticsSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Settings / Passcode state
  const [currentPasscode, setCurrentPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [passcodeStatus, setPasscodeStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch Analytics data
  const fetchAnalytics = useCallback(async () => {
    if (!authToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('period', period);
      if (period === 'custom') {
        params.set('startDate', customStartDate);
        params.set('endDate', customEndDate);
      }
      if (selectedCountryFilter && selectedCountryFilter !== 'all') {
        params.set('country', selectedCountryFilter);
      }

      const res = await fetch(`/api/admin/analytics?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'x-owner-token': authToken,
        },
      });

      if (res.status === 401) {
        setAuthToken('');
        localStorage.removeItem('quiktalks_owner_token');
        sessionStorage.removeItem('quiktalks_owner_token');
        setAuthError('Session expired. Please log in again.');
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to load analytics: ${res.statusText}`);
      }

      const data: AnalyticsSummaryResponse = await res.json();
      setSummary(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [authToken, period, customStartDate, customEndDate, selectedCountryFilter]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    setIsAuthenticating(true);
    setAuthError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        setAuthToken(data.token);
        if (rememberMe) {
          localStorage.setItem('quiktalks_owner_token', data.token);
        } else {
          sessionStorage.setItem('quiktalks_owner_token', data.token);
        }
        setPasswordInput('');
      } else {
        setAuthError(data.message || 'Incorrect Owner Passcode');
      }
    } catch {
      setAuthError('Authentication request failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setAuthToken('');
    localStorage.removeItem('quiktalks_owner_token');
    sessionStorage.removeItem('quiktalks_owner_token');
    setSummary(null);
  };

  // Handle Update Passcode
  const handleUpdatePasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeStatus(null);
    if (!newPasscode || newPasscode.length < 4) {
      setPasscodeStatus({ type: 'error', message: 'New passcode must be at least 4 characters.' });
      return;
    }
    if (newPasscode !== confirmPasscode) {
      setPasscodeStatus({ type: 'error', message: 'New passcodes do not match.' });
      return;
    }

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          oldPassword: currentPasscode,
          newPassword: newPasscode,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPasscodeStatus({ type: 'success', message: 'Owner Passcode successfully updated!' });
        setCurrentPasscode('');
        setNewPasscode('');
        setConfirmPasscode('');
      } else {
        setPasscodeStatus({ type: 'error', message: data.error || 'Failed to update passcode' });
      }
    } catch {
      setPasscodeStatus({ type: 'error', message: 'Network error updating passcode' });
    }
  };

  // Trigger fetch on tab open or filter change
  useEffect(() => {
    if (isOpen && authToken) {
      fetchAnalytics();
    }
  }, [isOpen, authToken, fetchAnalytics]);

  // Auto-refresh interval
  useEffect(() => {
    if (!isOpen || !authToken || !autoRefresh) return;
    const interval = setInterval(fetchAnalytics, 20000);
    return () => clearInterval(interval);
  }, [isOpen, authToken, autoRefresh, fetchAnalytics]);

  // Export handlers
  const handleExport = (format: 'csv' | 'json') => {
    if (!authToken) return;
    const params = new URLSearchParams();
    params.set('period', period);
    params.set('format', format);
    if (period === 'custom') {
      params.set('startDate', customStartDate);
      params.set('endDate', customEndDate);
    }
    params.set('token', authToken);
    window.open(`/api/admin/export?${params.toString()}`, '_blank');
  };

  // Toggle country accordion
  const toggleCountryExpand = (code: string) => {
    setExpandedCountries((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  // Filtered Country List
  const filteredCountries = useMemo(() => {
    if (!summary?.countryStats) return [];
    if (!searchQuery.trim()) return summary.countryStats;
    const q = searchQuery.toLowerCase();
    return summary.countryStats.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.regions.some((r) => r.name.toLowerCase().includes(q))
    );
  }, [summary, searchQuery]);

  // Filtered Recent Sessions
  const filteredSessions = useMemo(() => {
    if (!summary?.recentSessions) return [];
    if (!searchQuery.trim()) return summary.recentSessions;
    const q = searchQuery.toLowerCase();
    return summary.recentSessions.filter(
      (s) =>
        s.countryName.toLowerCase().includes(q) ||
        s.countryCode.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.device.toLowerCase().includes(q) ||
        s.browser.toLowerCase().includes(q)
    );
  }, [summary, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-6xl max-h-[94vh] bg-[#0A1128] border border-[#23356E] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
        
        {/* Modal Top Header */}
        <div className="px-5 py-4 bg-[#0E1733] border-b border-[#1E2E5E] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#172554] border border-[#2563EB] flex items-center justify-center text-cyan-400 shadow-md">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                  Owner Analytics Portal
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Owner Access Only
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Live visitor metrics, duration of stay, countries & regions tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {authToken && (
              <>
                <button
                  onClick={() => fetchAnalytics()}
                  disabled={isLoading}
                  className="p-2 rounded-xl bg-[#142042] hover:bg-[#1B2A58] border border-[#23356E] text-slate-300 hover:text-white transition-colors"
                  title="Refresh metrics"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-[#142042] hover:bg-rose-950/40 border border-[#23356E] hover:border-rose-700/50 text-slate-300 hover:text-rose-300 transition-colors"
                  title="Sign out of Owner Portal"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#142042] hover:bg-[#1B2A58] border border-[#23356E] text-slate-400 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {!authToken ? (
          /* ====================================================
             OWNER AUTHENTICATION LOGIN CARD
             ==================================================== */
          <div className="flex-1 p-6 sm:p-12 flex items-center justify-center">
            <div className="w-full max-w-md bg-[#0F1A3B] border border-[#253974] rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-cyan-400">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Owner Verification</h3>
              <p className="text-xs text-slate-300 mb-6">
                Enter your secure owner passcode to inspect private website traffic, duration of stay, and country metrics.
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="text-left">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Owner Passcode
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Enter passcode (default: owner2026)"
                      className="w-full px-4 py-3 rounded-xl bg-[#091026] border border-[#203060] text-white placeholder-slate-400 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                      autoFocus
                    />
                  </div>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium text-left">
                    {authError}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <span>Remember on this browser</span>
                  </label>
                  <span className="text-slate-400 font-mono text-[11px]">Passcode: owner2026</span>
                </div>

                <button
                  type="submit"
                  disabled={isAuthenticating || !passwordInput}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAuthenticating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Unlock Owner Analytics</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* ====================================================
             AUTHENTICATED OWNER DASHBOARD
             ==================================================== */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Filter Bar & Time Period Controls */}
            <div className="px-5 py-3 bg-[#0B1430] border-b border-[#1C2C5B] flex flex-wrap items-center justify-between gap-3">
              
              {/* Period Selector Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-[#070D22] p-1 rounded-2xl border border-[#1B2A58]">
                {(
                  [
                    { id: 'today', label: 'Today' },
                    { id: 'yesterday', label: 'Yesterday' },
                    { id: 'last_7_days', label: 'Last 7 Days' },
                    { id: 'last_30_days', label: 'Last 30 Days' },
                    { id: 'this_month', label: 'This Month' },
                    { id: 'all_time', label: 'All Time' },
                    { id: 'custom', label: 'Custom Range' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPeriod(p.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      period === p.id
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-[#121E42]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Action Buttons: Export & Auto-refresh */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport('csv')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#142042] hover:bg-[#1C2C5B] border border-[#23356E] text-xs font-medium text-slate-300 hover:text-white transition-colors"
                  title="Export filtered data to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={() => handleExport('json')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#142042] hover:bg-[#1C2C5B] border border-[#23356E] text-xs font-medium text-slate-300 hover:text-white transition-colors"
                  title="Export JSON report"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>JSON</span>
                </button>

                <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#121B38] border border-[#1F2E5E] text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span className="text-[11px]">Auto (20s)</span>
                </label>
              </div>
            </div>

            {/* Custom Date Pickers (Shown if "custom" period is active) */}
            {period === 'custom' && (
              <div className="px-5 py-2.5 bg-[#0D183A] border-b border-[#1E2E5E] flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-300 font-medium">From:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-[#080E24] border border-[#23356E] text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-medium">To:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-[#080E24] border border-[#23356E] text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  onClick={() => fetchAnalytics()}
                  className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  Apply Dates
                </button>
              </div>
            )}

            {/* Sub-Navigation Tabs */}
            <div className="px-5 border-b border-[#1C2C5B] bg-[#0A122C] flex items-center gap-4 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview & Metrics', icon: TrendingUp },
                { id: 'geo', label: 'Countries & Regions', icon: Globe2 },
                { id: 'duration', label: 'Duration of Stay', icon: Clock },
                { id: 'live_visitors', label: 'Live Visitors Log', icon: Users },
                { id: 'settings', label: 'Security & Passcode', icon: KeyRound },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center gap-2 py-3 border-b-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                      active
                        ? 'border-cyan-400 text-cyan-300'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                    {tab.id === 'live_visitors' && summary && (
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                        {summary.activeNow} Live
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Contents Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              
              {isLoading && !summary && (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                  <p className="text-sm">Crunching live analytics data...</p>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
                  <span>{error}</span>
                  <button
                    onClick={() => fetchAnalytics()}
                    className="px-3 py-1 bg-rose-500 text-white rounded-lg text-xs font-bold"
                  >
                    Retry
                  </button>
                </div>
              )}

              {summary && (
                <>
                  {/* ====================================================
                      TOP 4 HERO METRIC CARDS (Always visible or in overview)
                      ==================================================== */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Card 1: Total Visitors */}
                    <div className="bg-[#0E1736] border border-[#1E2E5E] rounded-2xl p-4 relative overflow-hidden shadow-md">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                        <span className="flex items-center gap-1.5 text-cyan-400">
                          <Users className="w-4 h-4" />
                          TOTAL VISITORS
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#16234D] text-[10px] text-slate-300 font-mono">
                          {summary.totalSessions} Sessions
                        </span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                        {summary.totalVisitors.toLocaleString()}
                      </div>
                      <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold">Unique Visitors</span> for{' '}
                        <span className="text-slate-200 capitalize">{period.replace(/_/g, ' ')}</span>
                      </div>
                    </div>

                    {/* Card 2: Average Duration of Stay */}
                    <div className="bg-[#0E1736] border border-[#1E2E5E] rounded-2xl p-4 relative overflow-hidden shadow-md">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                        <span className="flex items-center gap-1.5 text-amber-400">
                          <Clock className="w-4 h-4" />
                          AVG DURATION OF STAY
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#16234D] text-[10px] text-amber-300 font-mono">
                          Median: {formatDuration(summary.medianDurationSeconds)}
                        </span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono tracking-tight">
                        {formatDuration(summary.avgDurationSeconds)}
                      </div>
                      <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                        <span>Total Stay:</span>
                        <span className="text-slate-200 font-bold font-mono">
                          {formatTotalHours(summary.totalDurationSeconds)}
                        </span>
                        <span>accumulated</span>
                      </div>
                    </div>

                    {/* Card 3: Live Active Visitors */}
                    <div className="bg-[#0E1736] border border-[#1E2E5E] rounded-2xl p-4 relative overflow-hidden shadow-md">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                          </span>
                          LIVE ACTIVE NOW
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold">
                          Online
                        </span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
                        {summary.activeNow}
                      </div>
                      <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                        <span>Active on site in last 45s</span>
                      </div>
                    </div>

                    {/* Card 4: Total Calls & Engagement */}
                    <div className="bg-[#0E1736] border border-[#1E2E5E] rounded-2xl p-4 relative overflow-hidden shadow-md">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                        <span className="flex items-center gap-1.5 text-purple-400">
                          <Flame className="w-4 h-4" />
                          CALLS & ENGAGEMENT
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#16234D] text-[10px] text-purple-300 font-mono">
                          Bounce: {summary.bounceRate}%
                        </span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-purple-300 font-mono tracking-tight">
                        {summary.totalCallsMade.toLocaleString()}
                      </div>
                      <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                        <span>Total Voice Calls / Chats started</span>
                      </div>
                    </div>

                  </div>

                  {/* ====================================================
                      TAB 1: OVERVIEW & TIME SERIES CHART
                      ==================================================== */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      
                      {/* Interactive Time Series Trend Visualizer */}
                      <div className="bg-[#0E1736] border border-[#1E2E5E] rounded-2xl p-5 shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                          <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-cyan-400" />
                              Traffic & Duration Trend ({summary.dateRange.start} — {summary.dateRange.end})
                            </h3>
                            <p className="text-xs text-slate-400">
                              Visitors (bars) and Average Duration of Stay (line/metric)
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-mono">
                            <span className="flex items-center gap-1.5 text-cyan-400">
                              <span className="w-3 h-3 rounded bg-cyan-500 inline-block" />
                              Visitors
                            </span>
                            <span className="flex items-center gap-1.5 text-amber-400">
                              <span className="w-3 h-1.5 rounded bg-amber-400 inline-block" />
                              Avg Duration
                            </span>
                          </div>
                        </div>

                        {/* Visual Bar Chart */}
                        <div className="h-48 sm:h-64 flex items-end gap-1.5 sm:gap-2 pt-6 pb-2 border-b border-[#1F2E5E] overflow-x-auto">
                          {summary.timeSeries.map((pt, idx) => {
                            const maxVisitors = Math.max(...summary.timeSeries.map((t) => t.visitors), 1);
                            const heightPct = Math.max(8, Math.round((pt.visitors / maxVisitors) * 100));
                            return (
                              <div
                                key={idx}
                                className="flex-1 min-w-[28px] h-full flex flex-col items-center justify-end group relative"
                              >
                                {/* Tooltip on Hover */}
                                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center p-2 rounded-xl bg-[#060B1C] border border-[#23356E] text-[11px] shadow-2xl z-30 pointer-events-none whitespace-nowrap">
                                  <span className="font-bold text-white">{pt.label}</span>
                                  <span className="text-cyan-400">{pt.visitors} Visitors ({pt.sessions} sessions)</span>
                                  <span className="text-amber-400">Avg Stay: {formatDuration(pt.avgDurationSeconds)}</span>
                                  <span className="text-slate-400">Total: {formatTotalHours(pt.totalDurationSeconds)}</span>
                                </div>

                                {/* Bar */}
                                <div
                                  style={{ height: `${heightPct}%` }}
                                  className="w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-cyan-600/60 to-cyan-400 hover:from-cyan-500 hover:to-cyan-300 transition-all cursor-pointer relative"
                                >
                                  {pt.visitors > 0 && (
                                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {pt.visitors}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* X-Axis Labels */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2 overflow-x-auto">
                          {summary.timeSeries.filter((_, i) => i % Math.ceil(summary.timeSeries.length / 8) === 0).map((pt, idx) => (
                            <span key={idx}>{pt.label}</span>
                          ))}
                        </div>
                      </div>

                      {/* 2-Column Grid: Duration Distribution & Device Distribution */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        
                        {/* Duration Distribution */}
                        <div className="bg-[#0E1736] border border-[#1E2E5E] rounded-2xl p-5 shadow-lg">
                          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-amber-400" />
                            Duration of Stay Distribution
                          </h3>
                          <div className="space-y-2.5">
                            {summary.durationDistribution.map((d, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-300 font-medium">{d.bracket}</span>
                                  <span className="text-slate-400 font-mono">
                                    {d.count} ({d.percentage}%)
                                  </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-[#121C3D] overflow-hidden">
                                  <div
                                    style={{ width: `${d.percentage}%` }}
                                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Device & Platform Breakdown */}
                        <div className="bg-[#0E1736] border border-[#1E2E5E] rounded-2xl p-5 shadow-lg">
                          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                            <Monitor className="w-4 h-4 text-cyan-400" />
                            Devices & Browsers Breakdown
                          </h3>
                          <div className="space-y-3">
                            {summary.deviceStats.map((dev, idx) => {
                              const Icon = dev.device.toLowerCase() === 'mobile' ? Smartphone : dev.device.toLowerCase() === 'tablet' ? Tablet : Monitor;
                              return (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#121D42] border border-[#1F2E5E]">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-[#182654] flex items-center justify-center text-cyan-400">
                                      <Icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="text-xs font-bold text-white">{dev.device}</div>
                                      <div className="text-[11px] text-slate-400">{dev.percentage}% of total sessions</div>
                                    </div>
                                  </div>
                                  <span className="text-sm font-mono font-bold text-slate-200">{dev.count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>

                    </div>
                  )}

                  {/* ====================================================
                      TAB 2: COUNTRIES & REGIONS BREAKDOWN
                      ==================================================== */}
                  {activeTab === 'geo' && (
                    <div className="space-y-4">
                      
                      {/* Search & Country Count Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-md">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search countries, regions, or cities..."
                            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0F193B] border border-[#203060] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          {filteredCountries.length} countries recorded in period
                        </span>
                      </div>

                      {/* Country Stats Table */}
                      <div className="bg-[#0E1736] border border-[#1E2E5E] rounded-2xl overflow-hidden shadow-lg">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#121D42] border-b border-[#1E2E5E] text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                              <tr>
                                <th className="py-3 px-4">Country & Regions</th>
                                <th className="py-3 px-4">Visitors</th>
                                <th className="py-3 px-4">Traffic Share</th>
                                <th className="py-3 px-4">Avg Stay Duration</th>
                                <th className="py-3 px-4">Total Time Spent</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#172552]">
                              {filteredCountries.map((c) => {
                                const isExpanded = expandedCountries.has(c.code);
                                return (
                                  <React.Fragment key={c.code}>
                                    <tr className="hover:bg-[#121F47] transition-colors">
                                      <td className="py-3 px-4">
                                        <button
                                          onClick={() => toggleCountryExpand(c.code)}
                                          className="flex items-center gap-2.5 text-left font-bold text-white hover:text-cyan-300"
                                        >
                                          {c.regions.length > 0 ? (
                                            isExpanded ? (
                                              <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                                            ) : (
                                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                            )
                                          ) : (
                                            <span className="w-3.5" />
                                          )}
                                          <span className="text-base">{c.flag}</span>
                                          <span>{c.name}</span>
                                          <span className="text-[10px] font-mono text-slate-400 uppercase">({c.code})</span>
                                          {c.regions.length > 0 && (
                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1C2C5B] text-slate-300 font-normal">
                                              {c.regions.length} regions
                                            </span>
                                          )}
                                        </button>
                                      </td>
                                      <td className="py-3 px-4 font-mono font-bold text-slate-100">
                                        {c.visitors.toLocaleString()}{' '}
                                        <span className="text-[10px] text-slate-400 font-normal">({c.sessions} sess)</span>
                                      </td>
                                      <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                          <div className="w-16 h-2 rounded-full bg-[#142042] overflow-hidden">
                                            <div
                                              style={{ width: `${c.percentage}%` }}
                                              className="h-full rounded-full bg-cyan-400"
                                            />
                                          </div>
                                          <span className="font-mono text-[11px] text-slate-300">{c.percentage}%</span>
                                        </div>
                                      </td>
                                      <td className="py-3 px-4 font-mono font-bold text-amber-300">
                                        {formatDuration(c.avgDurationSeconds)}
                                      </td>
                                      <td className="py-3 px-4 font-mono text-slate-300">
                                        {formatTotalHours(c.totalDurationSeconds)}
                                      </td>
                                    </tr>

                                    {/* Expanded Regions Drilldown */}
                                    {isExpanded && c.regions.length > 0 && (
                                      <tr className="bg-[#091026]">
                                        <td colSpan={5} className="p-3 pl-12">
                                          <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                                            <MapPin className="w-3 h-3 text-cyan-400" />
                                            Regions & Cities in {c.name}:
                                          </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                            {c.regions.map((r, rIdx) => (
                                              <div
                                                key={rIdx}
                                                className="p-2 rounded-xl bg-[#101A3D] border border-[#1D2B57] flex items-center justify-between text-xs"
                                              >
                                                <span className="font-medium text-slate-200">{r.name}</span>
                                                <div className="text-right">
                                                  <div className="font-mono font-bold text-cyan-400">{r.visitors} vis</div>
                                                  <div className="font-mono text-[10px] text-amber-300">
                                                    {formatDuration(r.avgDurationSeconds)} avg
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* ====================================================
                      TAB 3: DURATION OF STAY ANALYTICS
                      ==================================================== */}
                  {activeTab === 'duration' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-[#0E1736] border border-[#1E2E5E] rounded-2xl p-5 shadow-lg text-center">
                          <Clock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                          <div className="text-xs text-slate-400 font-semibold uppercase">Average Duration of Stay</div>
                          <div className="text-3xl font-extrabold text-amber-300 font-mono mt-1">
                            {formatDuration(summary.avgDurationSeconds)}
                          </div>
                          <div className="text-xs text-slate-400 mt-2">Across all {summary.totalSessions} sessions</div>
                        </div>

                        <div className="bg-[#0E1736] border border-[#1E2E5E] rounded-2xl p-5 shadow-lg text-center">
                          <TrendingUp className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                          <div className="text-xs text-slate-400 font-semibold uppercase">Median Duration of Stay</div>
                          <div className="text-3xl font-extrabold text-cyan-300 font-mono mt-1">
                            {formatDuration(summary.medianDurationSeconds)}
                          </div>
                          <div className="text-xs text-slate-400 mt-2">50th percentile of visitor engagement</div>
                        </div>

                        <div className="bg-[#0E1736] border border-[#1E2E5E] rounded-2xl p-5 shadow-lg text-center">
                          <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                          <div className="text-xs text-slate-400 font-semibold uppercase">Total Time Spent on Site</div>
                          <div className="text-3xl font-extrabold text-purple-300 font-mono mt-1">
                            {formatTotalHours(summary.totalDurationSeconds)}
                          </div>
                          <div className="text-xs text-slate-400 mt-2">Sum total hours visitors browsed</div>
                        </div>
                      </div>

                      {/* Duration Distribution Breakdown */}
                      <div className="bg-[#0E1736] border border-[#1E2E5E] rounded-2xl p-5 shadow-lg">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-400" />
                          Visitor Stay Duration Brackets
                        </h3>
                        <div className="space-y-4">
                          {summary.durationDistribution.map((b, idx) => (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-200">{b.bracket}</span>
                                <span className="font-mono text-slate-300">
                                  {b.count} visits ({b.percentage}%)
                                </span>
                              </div>
                              <div className="w-full h-3 rounded-full bg-[#121D42] overflow-hidden">
                                <div
                                  style={{ width: `${b.percentage}%` }}
                                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ====================================================
                      TAB 4: LIVE VISITORS SESSION LOG
                      ==================================================== */}
                  {activeTab === 'live_visitors' && (
                    <div className="space-y-4">
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-md">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter session logs by country, device, browser..."
                            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0F193B] border border-[#203060] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          Showing latest {filteredSessions.length} sessions
                        </span>
                      </div>

                      <div className="bg-[#0E1736] border border-[#1E2E5E] rounded-2xl overflow-hidden shadow-lg">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#121D42] border-b border-[#1E2E5E] text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                              <tr>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Country & Region</th>
                                <th className="py-3 px-4">Device & Browser</th>
                                <th className="py-3 px-4">Arrival Date & Time</th>
                                <th className="py-3 px-4">Duration of Stay</th>
                                <th className="py-3 px-4">Calls Joined</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#172552]">
                              {filteredSessions.map((s) => (
                                <tr key={s.id} className="hover:bg-[#121F47] transition-colors">
                                  
                                  {/* Status */}
                                  <td className="py-3 px-4">
                                    {s.isOnline ? (
                                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        Online Now
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                                        Ended
                                      </span>
                                    )}
                                  </td>

                                  {/* Country & Region */}
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{s.countryFlag}</span>
                                      <div>
                                        <div className="font-bold text-white">{s.countryName}</div>
                                        <div className="text-[10px] text-slate-400">{s.region}</div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Device */}
                                  <td className="py-3 px-4">
                                    <div className="text-slate-200 font-medium">
                                      {s.device.charAt(0).toUpperCase() + s.device.slice(1)} • {s.browser}
                                    </div>
                                    <div className="text-[10px] text-slate-400">{s.os}</div>
                                  </td>

                                  {/* Arrival Time */}
                                  <td className="py-3 px-4 font-mono text-slate-300">
                                    {new Date(s.startTime).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                    })}
                                    <div className="text-[10px] text-slate-500">
                                      {new Date(s.startTime).toLocaleDateString()}
                                    </div>
                                  </td>

                                  {/* Duration of stay */}
                                  <td className="py-3 px-4 font-mono font-bold text-amber-300">
                                    {formatDuration(s.durationSeconds)}
                                  </td>

                                  {/* Calls joined */}
                                  <td className="py-3 px-4 font-mono text-slate-300">
                                    {s.callsJoined > 0 ? (
                                      <span className="text-purple-300 font-bold">{s.callsJoined} calls</span>
                                    ) : (
                                      <span className="text-slate-500">0</span>
                                    )}
                                  </td>

                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* ====================================================
                      TAB 5: SECURITY & PASSCODE SETTINGS
                      ==================================================== */}
                  {activeTab === 'settings' && (
                    <div className="max-w-xl mx-auto bg-[#0E1736] border border-[#1E2E5E] rounded-3xl p-6 shadow-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                          <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">Owner Security & Passcode</h3>
                          <p className="text-xs text-slate-400">Update the secret password used to access these analytics</p>
                        </div>
                      </div>

                      <form onSubmit={handleUpdatePasscode} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Current Owner Passcode
                          </label>
                          <input
                            type="password"
                            value={currentPasscode}
                            onChange={(e) => setCurrentPasscode(e.target.value)}
                            placeholder="Enter current passcode"
                            className="w-full px-4 py-2.5 rounded-xl bg-[#080E24] border border-[#23356E] text-white text-xs focus:outline-none focus:border-cyan-400"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            New Passcode
                          </label>
                          <input
                            type="password"
                            value={newPasscode}
                            onChange={(e) => setNewPasscode(e.target.value)}
                            placeholder="Enter new passcode (min 4 chars)"
                            className="w-full px-4 py-2.5 rounded-xl bg-[#080E24] border border-[#23356E] text-white text-xs focus:outline-none focus:border-cyan-400"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Confirm New Passcode
                          </label>
                          <input
                            type="password"
                            value={confirmPasscode}
                            onChange={(e) => setConfirmPasscode(e.target.value)}
                            placeholder="Re-type new passcode"
                            className="w-full px-4 py-2.5 rounded-xl bg-[#080E24] border border-[#23356E] text-white text-xs focus:outline-none focus:border-cyan-400"
                          />
                        </div>

                        {passcodeStatus && (
                          <div
                            className={`p-3 rounded-xl text-xs font-medium ${
                              passcodeStatus.type === 'success'
                                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                                : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                            }`}
                          >
                            {passcodeStatus.message}
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Update Passcode</span>
                        </button>
                      </form>
                    </div>
                  )}

                </>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
