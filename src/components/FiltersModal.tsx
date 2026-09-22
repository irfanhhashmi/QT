import React, { useState } from 'react';
import { MatchPreferences, UserGender, PreferredGender } from '../types';
import { COUNTRIES, getCountryFlag, getCountryName } from '../data/countries';

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: MatchPreferences;
  onUpdatePreferences: (updated: Partial<MatchPreferences>) => void;
}

const LANGUAGES = [
  { code: 'any', label: '🌐 Any Language' },
  { code: 'en', label: '🇺🇸 English' },
  { code: 'ur', label: '🇵🇰 Urdu' },
  { code: 'hi', label: '🇮🇳 Hindi' },
  { code: 'ar', label: '🇸🇦 Arabic' },
  { code: 'es', label: '🇪🇸 Spanish' },
  { code: 'fr', label: '🇫🇷 French' },
  { code: 'de', label: '🇩🇪 German' },
  { code: 'pt', label: '🇧🇷 Portuguese' },
  { code: 'tr', label: '🇹🇷 Turkish' },
  { code: 'ja', label: '🇯🇵 Japanese' },
  { code: 'zh', label: '🇨🇳 Mandarin' },
];

export const FiltersModal: React.FC<FiltersModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'country' | 'gender' | 'language'>('country');

  if (!isOpen) return null;

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePreferredCountry = (code: string) => {
    const current = preferences.preferredCountries || [];
    if (current.includes(code)) {
      onUpdatePreferences({ preferredCountries: current.filter((c) => c !== code) });
    } else {
      onUpdatePreferences({ preferredCountries: [...current, code] });
    }
  };

  const isGlobal = !preferences.preferredCountries || preferences.preferredCountries.length === 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="w-full max-w-lg bg-[#0C152B] border border-slate-700/80 rounded-3xl p-6 shadow-2xl relative text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 flex items-center justify-center text-lg">
              🎛️
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100">Match Filters</h3>
              <p className="text-[11px] text-slate-400">Choose country flags, gender and language</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center justify-center text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 mb-4 shrink-0 text-[11px] font-semibold">
          <button
            onClick={() => setActiveTab('country')}
            className={`py-1.5 px-1 text-center rounded-xl transition-all ${
              activeTab === 'country'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🌍 Flags
          </button>
          <button
            onClick={() => setActiveTab('gender')}
            className={`py-1.5 px-1 text-center rounded-xl transition-all ${
              activeTab === 'gender'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            👥 Gender
          </button>
          <button
            onClick={() => setActiveTab('language')}
            className={`py-1.5 px-1 text-center rounded-xl transition-all ${
              activeTab === 'language'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🗣️ Language
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'country' && (
            <div className="space-y-3">
              {/* Match Worldwide option */}
              <div 
                onClick={() => onUpdatePreferences({ preferredCountries: [] })}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  isGlobal
                    ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200 font-bold shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🌍</span>
                  <div>
                    <div className="text-sm font-semibold">Worldwide / Anywhere</div>
                    <div className="text-[11px] text-slate-400">Match with strangers anywhere across the globe</div>
                  </div>
                </div>
                {isGlobal && <span className="text-cyan-400 text-sm font-bold">✓ Active</span>}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search countries by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Country Badges Grid */}
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {filteredCountries.map((c) => {
                  const isSelected = preferences.preferredCountries?.includes(c.code);
                  return (
                    <button
                      key={c.code}
                      onClick={() => togglePreferredCountry(c.code)}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs border text-left transition-all ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200 font-bold'
                          : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-lg">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                      {isSelected && <span className="ml-auto text-indigo-400 text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'gender' && (
            <div className="space-y-4 p-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">I am:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['male', 'female', 'non-binary'] as UserGender[]).map((g) => (
                    <button
                      key={g}
                      onClick={() => onUpdatePreferences({ userGender: g })}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium capitalize transition-all ${
                        preferences.userGender === g
                          ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                          : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {g === 'male' ? '👨 Male' : g === 'female' ? '👩 Female' : '✨ Other'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-semibold text-slate-300 block">Match me with:</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['any', 'female', 'male', 'non-binary'] as PreferredGender[]).map((pg) => (
                    <button
                      key={pg}
                      onClick={() => onUpdatePreferences({ preferredGender: pg })}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium capitalize transition-all ${
                        preferences.preferredGender === pg
                          ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                          : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {pg === 'any' ? '🌐 Everyone / Any' : pg === 'female' ? '👩 Female Only' : pg === 'male' ? '👨 Male Only' : '✨ Non-Binary'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="grid grid-cols-2 gap-2 p-1 max-h-60 overflow-y-auto">
              {LANGUAGES.map((lang) => {
                const isSelected = preferences.language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => onUpdatePreferences({ language: lang.code })}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                        : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{lang.label}</span>
                    {isSelected && <span className="ml-auto text-slate-950 font-bold">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Button */}
        <div className="mt-4 pt-3 border-t border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg"
          >
            Apply Filters & Save
          </button>
        </div>

      </div>
    </div>
  );
};
