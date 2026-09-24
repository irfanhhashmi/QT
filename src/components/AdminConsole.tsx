import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useRole } from '../context/RoleContext';
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';
import { Shield, Key, LogOut, Plus, FileText, Users, BarChart3, AlertCircle, CheckCircle2, ExternalLink, Eye, Edit2, Trash2, X, Home, Sparkles, Layout } from 'lucide-react';
import { RichContentEditor } from './RichContentEditor';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const DEFAULT_AIRTALK_HOMEPAGE_SEO = `# Talk to Strangers Online: Instant Voice & Text Chat on QuikTalks

Looking for a fresh, safe, and engaging way to connect with interesting people from around the globe? **QuikTalks** offers a premier platform for free stranger voice and text chat. Dive into spontaneous 1-on-1 conversations, explore new global perspectives, and make genuine human connections without the pressure of cameras or personal profiles.

---

## Why Choose QuikTalks for Anonymous Voice Chat?

Discover a safer, more authentic way to chat online. QuikTalks prioritizes your comfort, privacy, and voice-first interactions.

- **Voice-First Connection**: Experience real conversations without video cameras, reducing performance pressure and unwanted content.
- **No Sign-Up Required**: Jump straight into voice calls instantly—no registration, no phone numbers, no mandatory profiles.
- **100% Free Forever**: Enjoy unlimited 1-on-1 voice calls and text chats at zero cost.
- **Anonymous & Secure**: Chat freely with creative nicknames knowing your personal identity is always protected.
- **Modern Omegle & Airtalk Alternative**: Get the best of random stranger voice chat with clean noise cancellation and smart region filters.

---

## How QuikTalks Works: Your Path to Global Conversations

Connecting with someone new takes less than 3 seconds:

1. **Tap the Call Button**: Click the bright green Call button on your screen.
2. **Choose Voice or Text**: Select your preferred mode of communication.
3. **Get Matched Instantly**: Our intelligent matchmaker connects you with a live partner worldwide.
4. **Start Talking**: Engage in meaningful discussions, share stories, or practice languages.
5. **Skip or Next**: Stay as long as you like, then easily skip to the next stranger whenever you choose.

---

## Key Features Designed for High Quality Calls

<div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
  <div class="p-4 bg-[#0A1128] border border-[#23356E] rounded-2xl">
    <h3 class="text-lg font-bold text-cyan-300 mb-1">🌍 Global Country Filters</h3>
    <p class="text-sm text-slate-300">Filter by region to connect with people from specific countries or practice foreign languages with native speakers.</p>
  </div>
  <div class="p-4 bg-[#0A1128] border border-[#23356E] rounded-2xl">
    <h3 class="text-lg font-bold text-cyan-300 mb-1">🎙️ High-Definition Audio</h3>
    <p class="text-sm text-slate-300">WebRTC crystal-clear audio engine with automated noise suppression and echo cancellation.</p>
  </div>
  <div class="p-4 bg-[#0A1128] border border-[#23356E] rounded-2xl">
    <h3 class="text-lg font-bold text-cyan-300 mb-1">🛡️ AI Safety & Moderation</h3>
    <p class="text-sm text-slate-300">Instant reporting and automated filtering keep the community friendly and safe for everyone.</p>
  </div>
  <div class="p-4 bg-[#0A1128] border border-[#23356E] rounded-2xl">
    <h3 class="text-lg font-bold text-cyan-300 mb-1">⚡ Auto Call Option</h3>
    <p class="text-sm text-slate-300">Enable Auto Call to automatically re-match when a caller disconnects for non-stop conversations.</p>
  </div>
</div>

---

## Frequently Asked Questions (FAQ)

### Q1: Is QuikTalks free to talk to strangers?
Yes, QuikTalks is 100% free with unlimited voice calling and text chat options for all users worldwide.

### Q2: Do I need a webcam or camera?
No! QuikTalks is audio-first. You do not need a camera to talk with strangers.

### Q3: How is my privacy protected?
We do not store your voice calls or force you to create a public profile. Your connection is encrypted peer-to-peer.

---

[👉 Start Free Voice Call Now](https://www.quiktalks.com)
`;

export const AdminConsole: React.FC<{ onOpenDiagnostics: () => void }> = ({ onOpenDiagnostics }) => {
  const { 
    user, 
    role, 
    loading, 
    authError, 
    signInWithGooglePopup, 
    signInWithGoogleRedirect, 
    signInWithEmail, 
    loginWithMasterPasscode,
    clearAuthError, 
    signOutUser 
  } = useRole();

  const [pages, setPages] = useState<any[]>([]);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pages' | 'homepage' | 'roles'>('pages');

  // Homepage SEO Content State
  const [homepageHeading, setHomepageHeading] = useState('Talk to Strangers Online: Instant Voice & Text Chat on QuikTalks');
  const [homepageEyebrow, setHomepageEyebrow] = useState('Free Anonymous Stranger Voice & Text Chat');
  const [homepageContent, setHomepageContent] = useState(DEFAULT_AIRTALK_HOMEPAGE_SEO);
  const [isSavingHomepage, setIsSavingHomepage] = useState(false);
  const [homepageSaveSuccess, setHomepageSaveSuccess] = useState('');

  // Login state
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [showGoogleLogin, setShowGoogleLogin] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  // Form State for Pages
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [pageError, setPageError] = useState('');
  const [previewingPage, setPreviewingPage] = useState<any | null>(null);

  const sanitizeSlug = (raw: string): string => {
    let clean = raw.trim().toLowerCase();
    if (clean.includes('://')) {
      try {
        const parts = clean.split('://')[1];
        const pathStart = parts.indexOf('/');
        if (pathStart !== -1) {
          clean = parts.substring(pathStart);
        } else {
          clean = '/';
        }
      } catch {
        clean = clean.replace(/^https?:\/\/[^\/]+/, '');
      }
    }
    clean = clean.replace(/^\/+(https?:\/\/[^\/]+)?/, '');
    if (!clean.startsWith('/')) {
      clean = '/' + clean;
    }
    if (clean.length > 1 && clean.endsWith('/')) {
      clean = clean.slice(0, -1);
    }
    return clean;
  };

  const handleLoadPageForEdit = (p: any) => {
    setEditingPageId(p.id);
    setTitle(p.title || '');
    setSlug(p.slug || '');
    setContent(p.content || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingPageId(null);
    setTitle('');
    setSlug('');
    setContent('');
  };

  // Role edit state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'editor' | 'writer'>('admin');
  const [isGrantingRole, setIsGrantingRole] = useState(false);
  const [roleSuccess, setRoleSuccess] = useState('');

  useEffect(() => {
    if (user && (role === 'owner' || role === 'admin' || role === 'editor')) {
      fetchPages();
      fetchHomepageContent();
      if (role === 'owner') {
        fetchUserProfiles();
      }
    }
  }, [user, role]);

  const fetchHomepageContent = async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'homepageSEO'));
      if (snap.exists()) {
        const data = snap.data();
        if (data.heading) setHomepageHeading(data.heading);
        if (data.eyebrow) setHomepageEyebrow(data.eyebrow);
        if (data.content) setHomepageContent(data.content);
      }
    } catch (err) {
      console.error('Error fetching homepage SEO content:', err);
    }
  };

  const handleSaveHomepageContent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingHomepage(true);
      await setDoc(doc(db, 'settings', 'homepageSEO'), {
        heading: homepageHeading.trim(),
        eyebrow: homepageEyebrow.trim(),
        content: homepageContent,
        updatedAt: Date.now(),
        updatedBy: user.email || user.uid,
      }, { merge: true });

      setHomepageSaveSuccess('Homepage SEO content successfully updated & published live!');
      setTimeout(() => setHomepageSaveSuccess(''), 4000);
    } catch (err: any) {
      alert('Error saving homepage content: ' + err.message);
    } finally {
      setIsSavingHomepage(false);
    }
  };

  const handleMasterKeyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterKeyInput.trim()) return;
    await loginWithMasterPasscode(masterKeyInput.trim());
  };

  const handleAddAdminByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) return;

    try {
      setIsGrantingRole(true);
      const cleanId = email.replace(/[^a-zA-Z0-9]/g, '_');
      await setDoc(doc(db, 'userProfiles', cleanId), {
        email: email,
        role: newAdminRole,
        grantedBy: user.email || 'master-owner',
        createdAt: Date.now(),
      }, { merge: true });

      setRoleSuccess(`Successfully granted ${newAdminRole.toUpperCase()} rights to ${email}`);
      setNewAdminEmail('');
      setTimeout(() => setRoleSuccess(''), 4000);
      fetchUserProfiles();
    } catch (err: any) {
      alert('Failed to grant role: ' + err.message);
    } finally {
      setIsGrantingRole(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) return;
    try {
      setIsSubmittingEmail(true);
      await signInWithEmail(emailInput.trim(), passwordInput.trim());
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const fetchPages = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'pages'));
      setPages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching pages:', err);
    }
  };

  const fetchUserProfiles = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'userProfiles'));
      setUserProfiles(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching user profiles:', err);
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setPageError('');
    if (!title.trim() || !slug.trim()) {
      setPageError('Title and slug are required.');
      return;
    }

    const cleanSlug = sanitizeSlug(slug);

    try {
      setIsCreating(true);
      const pageData = {
        title: title.trim(),
        slug: cleanSlug,
        content,
        authorUid: user.uid,
        authorEmail: user.email,
        updatedAt: Date.now(),
      };

      if (editingPageId) {
        await setDoc(doc(db, 'pages', editingPageId), pageData, { merge: true });
      } else {
        await addDoc(collection(db, 'pages'), {
          ...pageData,
          createdAt: Date.now(),
        });
      }

      setEditingPageId(null);
      setTitle('');
      setSlug('');
      setContent('');
      fetchPages();
    } catch (err: any) {
      setPageError(err.message || 'Failed to save page');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!window.confirm('Are you sure you want to delete this page?')) return;
    try {
      await deleteDoc(doc(db, 'pages', pageId));
      fetchPages();
    } catch (err) {
      console.error('Error deleting page:', err);
    }
  };

  const handleUpdateUserRole = async (targetUid: string, targetRole: string) => {
    try {
      await setDoc(doc(db, 'userProfiles', targetUid), { role: targetRole }, { merge: true });
      setRoleSuccess(`Updated role to ${targetRole}`);
      setTimeout(() => setRoleSuccess(''), 3000);
      fetchUserProfiles();
    } catch (err: any) {
      alert('Error updating role: ' + err.message);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-white p-6">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium">Verifying administrator authorization...</p>
      </div>
    );
  }

  // 2. Not Signed In State - Render Sign In Box
  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-[#0E1733] border border-[#23356E] rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-cyan-500/30">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">QuikTalks Admin Console</h1>
          <p className="text-slate-400 text-sm mb-6">
            Enter your Master Passcode or sign in with your authorized Google Account.
          </p>

          {authError && (
            <div className="bg-red-500/15 border border-red-500/40 text-red-300 p-3.5 rounded-xl text-xs mb-6 text-left relative flex items-start justify-between gap-2">
              <div>
                <p className="font-bold mb-1">Notice:</p>
                <p>{authError}</p>
              </div>
              <button 
                onClick={() => clearAuthError()}
                className="text-slate-400 hover:text-white font-bold text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* MASTER PASSCODE FORM - Instant Access */}
          {!showGoogleLogin && !showEmailLogin && (
            <div className="space-y-4 text-left">
              <form onSubmit={handleMasterKeyLogin} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">
                    Master Admin Passcode / Email
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={masterKeyInput}
                      onChange={(e) => setMasterKeyInput(e.target.value)}
                      placeholder="Enter Master Passcode (e.g. irfanhhashmi@gmail.com)"
                      required
                      className="w-full p-3.5 bg-[#0A1128] border border-[#23356E] rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/20 flex items-center justify-center gap-2"
                >
                  <Key className="w-5 h-5" />
                  Log In as Master Owner
                </button>
              </form>

              <div className="pt-4 border-t border-[#1E294A] flex flex-col gap-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowGoogleLogin(true)}
                  className="text-xs text-slate-400 hover:text-cyan-300"
                >
                  Or sign in via Google Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailLogin(true)}
                  className="text-xs text-slate-400 hover:text-cyan-300"
                >
                  Or sign in via Email & Password
                </button>
              </div>
            </div>
          )}

          {/* GOOGLE SIGN IN OPTIONS */}
          {showGoogleLogin && (
            <div className="space-y-3">
              <button
                onClick={() => signInWithGooglePopup()}
                className="w-full flex items-center justify-center gap-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/20"
              >
                <Key className="w-5 h-5" />
                Sign In with Google (Popup)
              </button>

              <button
                onClick={() => signInWithGoogleRedirect()}
                className="w-full flex items-center justify-center gap-2 bg-[#1A264D] hover:bg-[#23356E] text-slate-200 font-semibold py-3 px-6 rounded-xl border border-[#23356E] transition-all text-sm"
              >
                Use Direct Page Redirect
              </button>

              <button
                type="button"
                onClick={() => setShowGoogleLogin(false)}
                className="w-full text-xs text-slate-400 hover:text-white pt-2 text-center block"
              >
                ← Back to Master Passcode
              </button>
            </div>
          )}

          {/* EMAIL & PASSWORD FORM */}
          {showEmailLogin && (
            <form onSubmit={handleEmailSignIn} className="space-y-3 text-left">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Email Address</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="irfanhhashmi@gmail.com"
                  required
                  className="w-full p-3 bg-[#0A1128] border border-[#23356E] rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Password</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full p-3 bg-[#0A1128] border border-[#23356E] rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingEmail}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-all text-sm disabled:opacity-50"
              >
                {isSubmittingEmail ? 'Authenticating...' : 'Sign In / Register with Email'}
              </button>

              <button
                type="button"
                onClick={() => setShowEmailLogin(false)}
                className="w-full text-xs text-slate-400 hover:text-white pt-2 text-center block"
              >
                ← Back to Master Passcode
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // 3. Signed In but Not Authorized State
  if (role !== 'owner' && role !== 'admin' && role !== 'editor') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-[#0E1733] border border-red-500/30 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20 text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
          <p className="text-slate-300 text-sm mb-2">
            Logged in as: <span className="font-mono text-cyan-300">{user.email}</span>
          </p>
          <p className="text-slate-400 text-sm mb-6">
            Your account does not have administrative permissions. Please contact the Master Owner to grant access to your email.
          </p>
          <button
            onClick={() => signOutUser()}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 px-6 rounded-xl border border-slate-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // 4. Authorized Console View
  return (
    <div className="p-6 md:p-8 text-white max-w-6xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-[#0E1733] p-6 rounded-2xl border border-[#1E294A]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold">Admin Console</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
              role === 'owner' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
            }`}>
              {role === 'owner' ? 'Master Owner' : role}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Logged in as <span className="text-slate-200 font-medium">{user.email}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {role === 'owner' && (
            <button
              onClick={() => { window.location.hash = 'analytics'; }}
              className="flex items-center gap-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              Owner Analytics
            </button>
          )}

          <button
            onClick={() => signOutUser()}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          
          <button
            onClick={onOpenDiagnostics}
            className="flex items-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
          >
            <AlertCircle className="w-4 h-4" />
            View Diagnostics Logs
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1E294A] mb-8 gap-4 flex-wrap">
        <button
          onClick={() => setActiveTab('pages')}
          className={`flex items-center gap-2 pb-3 px-2 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'pages'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Dynamic Pages ({pages.length})
        </button>

        <button
          onClick={() => setActiveTab('homepage')}
          className={`flex items-center gap-2 pb-3 px-2 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'homepage'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-4 h-4 text-amber-400" />
          Homepage SEO Content
        </button>

        {role === 'owner' && (
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-2 pb-3 px-2 font-bold text-sm transition-colors border-b-2 ${
              activeTab === 'roles'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Manage Roles & Admins
          </button>
        )}
      </div>

      {/* TAB: HOMEPAGE SEO CONTENT */}
      {activeTab === 'homepage' && (
        <div className="bg-[#0E1733] p-6 sm:p-8 rounded-2xl border border-[#1E294A] shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23356E] pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Home className="w-5 h-5 text-amber-400" />
                Edit Homepage SEO Content
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Customize the copy, SEO headings, features, FAQs, and marketing content rendered on the main homepage below the calling dialer.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Replace current homepage content with Airtalk.live high-ranking SEO template?')) {
                  setHomepageHeading('Talk to Strangers Online: Instant Voice & Text Chat on QuikTalks');
                  setHomepageEyebrow('Free Anonymous Stranger Voice & Text Chat');
                  setHomepageContent(DEFAULT_AIRTALK_HOMEPAGE_SEO);
                }
              }}
              className="px-4 py-2 bg-amber-900/30 hover:bg-amber-800/50 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              Load Airtalk.live Template
            </button>
          </div>

          {homepageSaveSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{homepageSaveSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveHomepageContent} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 font-semibold uppercase mb-1">
                  Tagline / Eyebrow (Header Badge)
                </label>
                <input
                  type="text"
                  value={homepageEyebrow}
                  onChange={(e) => setHomepageEyebrow(e.target.value)}
                  placeholder="e.g. Free Anonymous Stranger Voice & Text Chat"
                  className="w-full p-3 bg-[#0A1128] border border-[#23356E] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold uppercase mb-1">
                  Main Headline (H1 Title)
                </label>
                <input
                  type="text"
                  value={homepageHeading}
                  onChange={(e) => setHomepageHeading(e.target.value)}
                  placeholder="e.g. Talk to Strangers Online: Instant Voice & Text Chat on QuikTalks"
                  className="w-full p-3 bg-[#0A1128] border border-[#23356E] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-semibold uppercase mb-2">
                Homepage Body Content (Rich Markdown & Raw HTML Supported)
              </label>
              <RichContentEditor
                value={homepageContent}
                onChange={setHomepageContent}
                placeholder="Write your homepage SEO content... Add headings, FAQs, feature cards, links, images, or custom HTML tags."
                minHeight="h-96"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSavingHomepage}
                className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 text-base"
              >
                {isSavingHomepage ? 'Publishing Updates...' : '💾 Save & Publish Homepage Content'}
              </button>

              <button
                type="button"
                onClick={() => { window.location.hash = ''; }}
                className="px-5 py-3.5 bg-[#1A264D] hover:bg-[#23356E] text-slate-200 font-bold rounded-xl border border-[#23356E] transition-all text-sm flex items-center gap-1.5"
              >
                <ExternalLink className="w-4 h-4 text-cyan-400" />
                View Live Homepage
              </button>
            </div>
          </form>
        </div>
      )}
      {activeTab === 'pages' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Create Page Form */}
          <div className="lg:col-span-7 bg-[#0E1733] p-6 rounded-2xl border border-[#1E294A] h-fit shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              Create & Design Dynamic SEO Page
            </h2>

            {pageError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm mb-4">
                {pageError}
              </div>
            )}

            <form onSubmit={handleCreatePage} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 font-semibold uppercase mb-1">Page Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. SEO Landing Page, Terms, Privacy, About"
                    className="w-full p-3 bg-[#0A1128] border border-[#23356E] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-semibold uppercase mb-1">URL Path (Slug)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. /about or /seo-guide"
                    className="w-full p-3 bg-[#0A1128] border border-[#23356E] rounded-xl text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold uppercase mb-2">
                  Rich Page Content & Visual Formatting
                </label>
                <RichContentEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Design your page content here... Use the toolbar above to add links, images, CTA buttons, headings, or select a pre-built template."
                  minHeight="h-72"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 text-base"
              >
                {isCreating ? 'Publishing Page...' : 'Publish Dynamic Page'}
              </button>
            </form>
          </div>

          {/* Existing Pages List */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
              <span>Published Pages ({pages.length})</span>
            </h2>

            {pages.length === 0 ? (
              <div className="bg-[#0E1733] p-8 rounded-2xl border border-[#1E294A] text-center text-slate-400">
                No custom pages created yet. Use the form to publish your first page.
              </div>
            ) : (
              pages.map((p) => (
                <div key={p.id} className="bg-[#0E1733] p-5 rounded-2xl border border-[#1E294A] space-y-3">
                  <div>
                    <h3 className="font-bold text-lg text-white">{p.title}</h3>
                    <p className="text-xs font-mono text-cyan-400 mt-0.5">{p.slug}</p>
                    {p.content && (
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">{p.content}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#1E294A] flex-wrap">
                    <button
                      onClick={() => setPreviewingPage(p)}
                      className="text-xs text-cyan-300 hover:text-white bg-cyan-900/30 hover:bg-cyan-800/50 border border-cyan-500/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </button>

                    <button
                      onClick={() => handleLoadPageForEdit(p)}
                      className="text-xs text-slate-200 hover:text-white bg-[#1A264D] hover:bg-[#23356E] border border-[#23356E] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-semibold"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>

                    <button
                      onClick={() => handleDeletePage(p.id)}
                      className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-semibold ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* FULL-SCREEN LIVE PAGE PREVIEW MODAL */}
      {previewingPage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0E1733] w-full max-w-4xl rounded-3xl border border-[#23356E] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-[#23356E] bg-[#0A1128]">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">{previewingPage.slug}</span>
                <h2 className="text-2xl font-bold text-white">{previewingPage.title}</h2>
              </div>
              <button
                onClick={() => setPreviewingPage(null)}
                className="p-2 text-slate-400 hover:text-white bg-[#1A264D] rounded-xl hover:bg-[#23356E] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto text-slate-200 space-y-6">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-3xl font-extrabold text-white mb-4 border-b border-[#23356E] pb-2" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-white mb-3 mt-6 border-b border-[#23356E]/50 pb-1" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-xl font-bold text-cyan-300 mb-2 mt-4" {...props} />,
                  p: ({ node, ...props }) => <p className="mb-4 text-slate-300 leading-relaxed text-base" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-1 text-slate-300" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-1 text-slate-300" {...props} />,
                  li: ({ node, ...props }) => <li className="text-slate-300" {...props} />,
                  a: ({ node, href, children, ...props }) => {
                    const isCta = typeof children === 'string' && children.startsWith('👉');
                    if (isCta) {
                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg my-3 no-underline text-base"
                        >
                          {children}
                        </a>
                      );
                    }
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 underline font-semibold"
                        {...props}
                      >
                        {children}
                      </a>
                    );
                  },
                  img: ({ node, src, alt, ...props }) => (
                    <div className="my-6 rounded-2xl overflow-hidden border border-[#23356E] bg-[#0A1128] shadow-xl">
                      <img src={src} alt={alt} className="w-full h-auto max-h-[450px] object-cover" {...props} />
                      {alt && <p className="text-xs text-slate-400 text-center py-2 bg-[#0A1128]">{alt}</p>}
                    </div>
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-cyan-500 pl-4 py-2 italic my-4 text-slate-300 bg-cyan-950/20 rounded-r-xl" {...props} />
                  ),
                  strong: ({ node, ...props }) => <strong className="font-bold text-white bg-blue-900/40 px-1 rounded" {...props} />,
                  code: ({ node, ...props }) => <code className="bg-[#0A1128] border border-[#23356E] text-cyan-300 px-1.5 py-0.5 rounded font-mono text-xs" {...props} />,
                }}
              >
                {previewingPage.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLES & PERMISSIONS */}
      {activeTab === 'roles' && role === 'owner' && (
        <div className="space-y-6">
          {roleSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              {roleSuccess}
            </div>
          )}

          {/* Form to Grant Admin Access by Email */}
          <div className="bg-[#0E1733] p-6 rounded-2xl border border-cyan-500/30 shadow-xl">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-cyan-400">
              <Users className="w-5 h-5" />
              Grant Admin Rights to New User / SEO Team
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              Enter your SEO partner's email address below to grant them instant Admin access to create & manage dynamic pages.
            </p>

            <form onSubmit={handleAddAdminByEmail} className="flex flex-col md:flex-row items-end gap-3">
              <div className="flex-1 w-full">
                <label className="block text-xs text-slate-300 font-semibold mb-1 uppercase">
                  User Email Address
                </label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="e.g. seo-partner@company.com"
                  required
                  className="w-full p-3 bg-[#0A1128] border border-[#23356E] rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="w-full md:w-48">
                <label className="block text-xs text-slate-300 font-semibold mb-1 uppercase">
                  Assigned Role
                </label>
                <select
                  value={newAdminRole}
                  onChange={(e: any) => setNewAdminRole(e.target.value)}
                  className="w-full p-3 bg-[#0A1128] border border-[#23356E] text-white text-sm rounded-xl focus:outline-none focus:border-cyan-500"
                >
                  <option value="admin">Admin (Full CMS Access)</option>
                  <option value="editor">Editor (Pages Only)</option>
                  <option value="writer">Writer</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isGrantingRole}
                className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/20 whitespace-nowrap disabled:opacity-50"
              >
                {isGrantingRole ? 'Granting Access...' : '+ Grant Admin Access'}
              </button>
            </form>
          </div>

          {/* List of Existing User Profiles & Roles */}
          <div className="bg-[#0E1733] p-6 rounded-2xl border border-[#1E294A]">
            <h2 className="text-xl font-bold mb-2">Authorized Accounts ({userProfiles.length})</h2>
            <p className="text-slate-400 text-sm mb-6">
              All accounts with configured administrative or editor roles.
            </p>

            <div className="space-y-3">
              {userProfiles.length === 0 ? (
                <p className="text-slate-400 text-sm">No secondary admins configured yet. Use the form above to grant access.</p>
              ) : (
                userProfiles.map((prof) => (
                  <div key={prof.id} className="bg-[#0A1128] p-4 rounded-xl border border-[#23356E] flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-bold text-sm text-white">{prof.email || prof.uid}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Role: <span className="font-bold text-cyan-400 uppercase">{prof.role || 'writer'}</span>
                        {prof.grantedBy && <span className="ml-2 text-slate-500">• Granted by {prof.grantedBy}</span>}
                      </p>
                    </div>

                    {prof.email?.toLowerCase() !== 'irfanhhashmi@gmail.com' ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={prof.role || 'writer'}
                          onChange={(e) => handleUpdateUserRole(prof.id, e.target.value)}
                          className="bg-[#0E1733] border border-[#23356E] text-white text-xs rounded-lg p-2 focus:outline-none font-medium"
                        >
                          <option value="admin">Admin (CMS Access)</option>
                          <option value="editor">Editor</option>
                          <option value="writer">Writer</option>
                        </select>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                        Master Owner
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
