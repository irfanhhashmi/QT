import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ArrowLeft, PhoneCall, Globe, Share2, Sparkles, Home, Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { QuikTalksIcon } from './Logo';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

interface DynamicPageViewProps {
  page: {
    title: string;
    slug: string;
    content: string;
    createdAt?: number;
  };
  onGoHome: () => void;
}

export const DynamicPageView: React.FC<DynamicPageViewProps> = ({ page, onGoHome }) => {
  const isContactPage = page.slug.toLowerCase().includes('contact');

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactCategory, setContactCategory] = useState('Support & Help');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      setSubmitError('Please fill out all required fields (Name, Email, and Message).');
      return;
    }

    try {
      setIsSubmitting(true);
      await addDoc(collection(db, 'contactMessages'), {
        name: contactName.trim(),
        email: contactEmail.trim(),
        category: contactCategory,
        subject: contactSubject.trim() || 'General Inquiry',
        message: contactMessage.trim(),
        submittedAt: Date.now(),
        ip: window.location.hostname,
        userAgent: navigator.userAgent,
      });

      setSubmitSuccess(true);
      setContactName('');
      setContactEmail('');
      setContactSubject('');
      setContactMessage('');
    } catch (err: any) {
      console.error('Error submitting contact form:', err);
      setSubmitError('Failed to send message: ' + (err.message || 'Server error. Please try again or email support@quiktalks.com directly.'));
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#060B18] text-white flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 bg-[#0A1128]/90 backdrop-blur-md border-b border-[#23356E] px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onGoHome}>
            <QuikTalksIcon className="w-8 h-8 text-cyan-400" />
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                QuikTalks
              </span>
              <span className="hidden sm:inline-block text-[10px] text-cyan-300/80 uppercase font-mono ml-2 tracking-widest border border-cyan-500/30 px-1.5 py-0.5 rounded">
                Official
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onGoHome}
              className="px-3.5 py-1.5 bg-[#1A264D] hover:bg-[#23356E] text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-[#23356E] flex items-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5 text-cyan-400" />
              <span>Main App</span>
            </button>

            <button
              onClick={onGoHome}
              className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg hover:shadow-cyan-500/20 flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Start Call Now</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Content Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12">
        <div className="bg-[#0E1733] border border-[#23356E] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          {/* Breadcrumb & Navigation */}
          <div className="flex items-center justify-between border-b border-[#23356E]/80 pb-4">
            <button
              onClick={onGoHome}
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to QuikTalks</span>
            </button>
            <span className="text-xs font-mono text-slate-400 bg-[#0A1128] px-2.5 py-1 rounded-lg border border-[#23356E]">
              {page.slug}
            </span>
          </div>

          {/* Page Title */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {page.title}
            </h1>
          </div>

          {/* Rich Content Markdown */}
          <div className="prose prose-invert max-w-none text-slate-200 pt-2">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-3xl font-extrabold text-white mb-4 mt-6 border-b border-[#23356E] pb-2" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-2xl font-bold text-white mb-3 mt-8 border-b border-[#23356E]/50 pb-1" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-xl font-bold text-cyan-300 mb-2 mt-6" {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p className="mb-4 text-slate-300 leading-relaxed text-base sm:text-lg" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-300 text-base" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal pl-6 mb-6 space-y-2 text-slate-300 text-base" {...props} />
                ),
                li: ({ node, ...props }) => <li className="text-slate-300" {...props} />,
                a: ({ node, href, children, ...props }) => {
                  const isCta = typeof children === 'string' && children.startsWith('👉');
                  if (isCta) {
                    return (
                      <div className="my-6">
                        <a
                          href={href}
                          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold py-4 px-8 rounded-2xl transition-all shadow-xl hover:shadow-cyan-500/30 no-underline text-lg w-full sm:w-auto text-center"
                        >
                          {children}
                        </a>
                      </div>
                    );
                  }
                  return (
                    <a
                      href={href}
                      className="text-cyan-400 hover:text-cyan-300 underline font-semibold transition-colors"
                      {...props}
                    >
                      {children}
                    </a>
                  );
                },
                img: ({ node, src, alt, ...props }) => (
                  <div className="my-8 rounded-2xl overflow-hidden border border-[#23356E] bg-[#0A1128] shadow-2xl">
                    <img src={src} alt={alt} className="w-full h-auto max-h-[500px] object-cover" {...props} />
                    {alt && <p className="text-xs text-slate-400 text-center py-2.5 bg-[#0A1128] border-t border-[#23356E] font-medium">{alt}</p>}
                  </div>
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-cyan-500 pl-5 py-3 italic my-6 text-slate-200 bg-cyan-950/30 rounded-r-2xl border-t border-b border-r border-cyan-500/10 text-base" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-bold text-white bg-blue-900/40 px-1.5 py-0.5 rounded border border-blue-500/20" {...props} />
                ),
                code: ({ node, ...props }) => (
                  <code className="bg-[#0A1128] border border-[#23356E] text-cyan-300 px-2 py-0.5 rounded font-mono text-xs" {...props} />
                ),
              }}
            >
              {page.content}
            </ReactMarkdown>
          </div>

          {/* Interactive Contact Form (Renders when viewing Contact page) */}
          {isContactPage && (
            <div className="mt-8 bg-[#0A1128] border border-[#23356E] p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
              <div className="flex items-center gap-2 border-b border-[#23356E] pb-3">
                <Mail className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xl font-bold text-white">Send Us a Direct Message</h3>
              </div>

              {submitSuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-6 rounded-2xl text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="text-lg font-bold text-white">Message Received!</h4>
                  <p className="text-xs text-emerald-200/90 max-w-md mx-auto">
                    Thank you for reaching out to QuikTalks support. Our community team will review your inquiry and respond to your email within 12-24 hours.
                  </p>
                  <button
                    onClick={() => setSubmitSuccess(false)}
                    className="mt-2 px-4 py-2 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 rounded-xl text-xs font-semibold"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  {submitError && (
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl flex items-center gap-2 text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Alex Smith"
                        className="w-full p-3 bg-[#060B18] border border-[#23356E] rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                        Your Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="e.g. alex@example.com"
                        className="w-full p-3 bg-[#060B18] border border-[#23356E] rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                        Category
                      </label>
                      <select
                        value={contactCategory}
                        onChange={(e) => setContactCategory(e.target.value)}
                        className="w-full p-3 bg-[#060B18] border border-[#23356E] rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Support & Help">Support & Help</option>
                        <option value="Safety & Report">Safety & Report</option>
                        <option value="Feedback & Feature Request">Feedback & Feature Request</option>
                        <option value="Business & Partnership">Business & Partnership</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        placeholder="e.g. Question about microphone filters"
                        className="w-full p-3 bg-[#060B18] border border-[#23356E] rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Write your message or inquiry here..."
                      className="w-full p-3 bg-[#060B18] border border-[#23356E] rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Sending Message...' : 'Submit Message'}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Page Footer CTA Card */}
          <div className="mt-12 p-6 sm:p-8 bg-gradient-to-r from-[#0A1128] via-[#121E42] to-[#0A1128] rounded-2xl border border-cyan-500/30 text-center space-y-4 shadow-xl">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full text-cyan-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>QuikTalks Instant Voice Match</span>
            </div>
            <h3 className="text-2xl font-extrabold text-white">Ready to talk with people around the world?</h3>
            <p className="text-slate-300 text-sm max-w-lg mx-auto">
              No registration or account needed. Connect in 1-on-1 audio conversations instantly on QuikTalks.
            </p>
            <button
              onClick={onGoHome}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold py-3.5 px-8 rounded-xl shadow-lg transition-all text-base"
            >
              <PhoneCall className="w-5 h-5" />
              <span>Start Free Call Now</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#23356E] bg-[#0A1128] py-8 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <QuikTalksIcon className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-white">QuikTalks</span>
            <span>© {new Date().getFullYear()} QuikTalks. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onGoHome} className="hover:text-cyan-300 transition-colors">Home</button>
            <button onClick={onGoHome} className="hover:text-cyan-300 transition-colors">Blogs</button>
            <a href="https://www.quiktalks.com" className="hover:text-cyan-300 transition-colors">QuikTalks Portal</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
