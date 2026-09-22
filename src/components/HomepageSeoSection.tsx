import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Sparkles, PhoneCall, Shield, Globe, Mic, Zap, HelpCircle } from 'lucide-react';
import { ZapierHeroSection } from './zapier/HeroSection';
import { SocialProofMarquee } from './zapier/SocialProofMarquee';
import { ZapierInteractiveConnector } from './zapier/InteractiveConnector';
import { ZapierBentoGrid } from './zapier/BentoGrid';
import { ZapierFooter } from './zapier/ZapierFooter';

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const DEFAULT_SEO_EYEBROW = "Free Anonymous Stranger Voice & Text Chat";
export const DEFAULT_SEO_HEADING = "Talk to Strangers Instantly with Anonymous Voice & Text Chat";
export const DEFAULT_SEO_CONTENT = `# Talk to Strangers Instantly with Anonymous Voice & Text Chat

Looking for a fresh, safe, and engaging browser random voice caller to connect with interesting people around the globe? **QuickTalks** (and QuickTalks Live) offers the ultimate platform for free anonymous voice chat and random text chat with strangers. Dive into spontaneous 1-on-1 conversations, explore new global perspectives, and enjoy a stranger call site with no signup required.

---

## Free Random Voice Chat – No Signup Required

Discover a safer, more authentic way to talk to strangers online. QuickTalks prioritizes your privacy with instant audio-first connections.

- **Voice Chat with Strangers**: Experience real 1-on-1 conversations without webcam pressure or camera requirements.
- **No Signup Needed**: Jump straight into quicktalks voice chat instantly—no registration, phone numbers, or account creation.
- **100% Free Forever**: Enjoy unlimited random voice chat and text messaging at zero cost.
- **Anonymous Audio Chat Online**: Chat freely knowing your IP address and personal identity remain strictly encrypted peer-to-peer.

---

## The Best Audio-Only Omegle Alternative

QuickTalks is engineered as a modern Omegle voice alternative, bringing together crystal-clear WebRTC audio, automated noise suppression, and smart country filters.

- **Talk to Strangers No Camera**: Audio-first design prevents unwanted video exposure while keeping conversation focused and genuine.
- **Global Country Filters**: Choose native speakers or specific regions for language learning, English practice, or casual global venting.
- **Auto Call Re-matching**: Enable continuous calling to automatically connect to the next stranger as soon as a chat ends.

---

## Safe and Anonymous Text Chat with Strangers

Prefer typing? Switch instantly between quicktalks voice chat and random text chat with strangers with 1-click mode toggling.

- **Instant Image & Message Sharing**: Share photos and text messages securely inside the session.
- **AI Moderation & Safety**: Automated filters and 1-click block tools keep community interactions respectful.

---

## Frequently Asked Questions (FAQ)

### How does QuickTalks protect my privacy?
QuickTalks uses peer-to-peer WebRTC connections with end-to-end encryption. We do not store your voice calls, log conversations, or require personal profile registration.

### Can I use QuickTalks on mobile browsers without an app?
Yes! QuickTalks is fully optimized as a Progressive Web App (PWA) that runs smoothly on iOS Safari, Android Chrome, desktop browsers, and tablets without downloading an app.

---

[👉 Start Free Voice Call Now](https://quktalks.com)
`;

interface HomepageSeoSectionProps {
  onStartCallWithPref?: (countryCode: string, mode: string) => void;
}

export const HomepageSeoSection: React.FC<HomepageSeoSectionProps> = ({ onStartCallWithPref }) => {
  const [seoEyebrow, setSeoEyebrow] = useState(DEFAULT_SEO_EYEBROW);
  const [seoHeading, setSeoHeading] = useState(DEFAULT_SEO_HEADING);
  const [seoContent, setSeoContent] = useState(DEFAULT_SEO_CONTENT);

  useEffect(() => {
    const fetchSeoContent = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'homepageSEO'));
        if (snap.exists()) {
          const data = snap.data();
          if (data.eyebrow) setSeoEyebrow(data.eyebrow);
          if (data.heading) setSeoHeading(data.heading);
          if (data.content) setSeoContent(data.content);
        }
      } catch (err) {
        console.error('Error fetching homepage SEO:', err);
      }
    };
    fetchSeoContent();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full text-left select-text space-y-4">
      
      {/* 1. Above-The-Fold Zapier Hero Section */}
      <ZapierHeroSection onStartCall={scrollToTop} />

      {/* 2. Infinite Social Proof Logo Marquee */}
      <SocialProofMarquee />

      {/* 3. Interactive App / Connection Node Flow */}
      <ZapierInteractiveConnector onStartCallWithPref={onStartCallWithPref} />

      {/* 4. Asymmetric Bento Box Feature Grid */}
      <ZapierBentoGrid />

      {/* 5. Dynamic Admin-Editable SEO Markdown Section */}
      <section id="seo-section" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-[#0A1128]/95 backdrop-blur-md rounded-3xl border border-[#1E2C58] p-6 sm:p-12 shadow-2xl space-y-8 relative overflow-hidden">
          
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Top Header Tag */}
          <div className="flex items-center justify-between gap-4 border-b border-[#1E294A] pb-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-wide uppercase shadow-sm">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              {seoEyebrow}
            </span>
          </div>

          {/* Markdown Content */}
          <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-base sm:text-lg space-y-6">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                h1: ({ node, ...props }) => <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 border-b border-[#1E294A] pb-4 tracking-tight" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 mt-10 border-b border-[#1E294A]/60 pb-2 tracking-tight" {...props} />,
                h3: ({ node, ...props }) => (
                  <div className="p-6 bg-[#0E1730] border border-[#23356E] rounded-2xl shadow-lg my-6 hover:border-cyan-500/50 transition-colors">
                    <h3 className="text-xl font-bold text-cyan-300 mb-2" {...props} />
                  </div>
                ),
                p: ({ node, ...props }) => <p className="mb-4 text-slate-300 leading-relaxed font-normal" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-300" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-6 space-y-2 text-slate-300" {...props} />,
                li: ({ node, ...props }) => <li className="text-slate-300 leading-relaxed" {...props} />,
                a: ({ node, href, children, ...props }) => {
                  const textContent = typeof children === 'string' ? children : String(children || '');
                  const isCta = textContent.startsWith('👉') || textContent.toLowerCase().includes('call');
                  if (isCta) {
                    return (
                      <button
                        onClick={scrollToTop}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold py-4 px-8 rounded-2xl transition-all shadow-xl hover:shadow-emerald-500/20 my-4 text-base cursor-pointer active:scale-95"
                      >
                        <PhoneCall className="w-5 h-5" />
                        {children}
                      </button>
                    );
                  }
                  return (
                    <a
                      href={href}
                      className="text-cyan-400 hover:text-cyan-300 underline font-semibold"
                      {...props}
                    >
                      {children}
                    </a>
                  );
                },
                img: ({ node, src, alt, ...props }) => (
                  <div className="my-8 rounded-2xl overflow-hidden border border-[#23356E] bg-[#0A1128] shadow-2xl">
                    <img src={src} alt={alt} className="w-full h-auto max-h-[500px] object-cover" {...props} />
                    {alt && <p className="text-xs text-slate-400 text-center py-2.5 bg-[#0A1128]">{alt}</p>}
                  </div>
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-cyan-500 pl-4 py-3 italic my-6 text-slate-200 bg-cyan-950/40 rounded-r-2xl font-serif-display text-lg" {...props} />
                ),
                strong: ({ node, ...props }) => <strong className="font-bold text-white bg-blue-900/40 px-1.5 py-0.5 rounded" {...props} />,
                code: ({ node, ...props }) => <code className="bg-[#050A15] border border-[#23356E] text-cyan-300 px-2 py-0.5 rounded font-mono text-xs" {...props} />,
              }}
            >
              {seoContent}
            </ReactMarkdown>
          </div>

        </div>
      </section>

      {/* 6. High-Contrast Footer & Final CTA */}
      <ZapierFooter onStartCall={scrollToTop} />

    </div>
  );
};

