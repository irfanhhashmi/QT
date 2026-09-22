export interface DynamicPage {
  id?: string;
  title: string;
  slug: string;
  content: string;
  createdAt?: number;
  updatedAt?: number;
}

export const DEFAULT_PAGES: Record<string, DynamicPage> = {
  '/contact': {
    id: 'default_contact',
    title: 'Contact Us - QuikTalks Support & Community Help',
    slug: '/contact',
    content: `# Contact QuikTalks Support

We are here to help! Whether you have questions about using QuikTalks, want to report an issue, have feature suggestions, or need business inquiries, our support team is available 24/7.

---

## 📬 Get in Touch Direct Options

- **General & Support Inquiries**: [support@quiktalks.com](mailto:support@quiktalks.com)
- **Safety, Moderation & Reports**: [safety@quiktalks.com](mailto:safety@quiktalks.com)
- **Legal & Privacy Desk**: [legal@quiktalks.com](mailto:legal@quiktalks.com)
- **Business & Advertising Partnerships**: [partners@quiktalks.com](mailto:partners@quiktalks.com)

---

## ⚡ Frequently Asked Questions Before Reaching Out

### 1. Do I need an account or registration to call?
No! QuikTalks is 100% free with no sign-up or phone number required. Just click **Start Call** on the homepage to connect with someone new instantly.

### 2. How do I report an abusive caller?
During any active call or text chat, click the red **Report** button at the top or bottom of your console. You can specify the reason (nudity, harassment, spam, hate speech) and our moderation systems will instantly flag and disconnect the user.

### 3. Why is my microphone not working?
Make sure your browser has granted microphone permissions to \`quiktalks.com\`. On desktop, click the lock icon in your address bar and ensure **Microphone** is set to **Allow**.

---

## 💬 Send Us a Direct Support Message

Please use the direct contact form below or email us directly at **support@quiktalks.com**. We typically respond within 12 to 24 hours.

[👉 Start Free Voice Call Now](https://www.quiktalks.com)
`,
    createdAt: Date.now(),
  },
  '/privacy': {
    id: 'default_privacy',
    title: 'Privacy Policy - QuikTalks Anonymous Voice Chat',
    slug: '/privacy',
    content: `# Privacy Policy for QuikTalks

**Effective Date:** January 1, 2026

At **QuikTalks** (accessible from \`https://www.quiktalks.com\`), your privacy and anonymity are our top priorities. This Privacy Policy outlines the types of information we collect, how it is used, and how we safeguard your identity.

---

## 1. Zero Registration & Anonymity First

- **No Personal Profiles**: We do not require you to register, log in with an email, or provide your real name, phone number, or social media accounts.
- **Anonymous Callsigns**: When you connect to calls, you are assigned an ephemeral callsign or nickname.

## 2. Peer-to-Peer Voice Encrypted Communication

- All 1-on-1 audio and video connections use industry-standard WebRTC peer-to-peer encryption.
- **No Audio Recording**: QuikTalks does NOT record, listen to, or store your voice audio calls. All voice data streams directly between participants' devices.

## 3. Data We Collect & Technical Telemetry

To ensure reliable matchmaking, prevent abuse, and route calls through optimal TURN servers, we collect minimal technical metadata:
- **IP Address & Country Location**: Used strictly for server region routing and country flag filters.
- **Device & Browser Type**: Used to optimize WebRTC performance for mobile Safari, Chrome, Android, and Desktop.
- **Temporary Session Tokens**: Ephemeral tokens used exclusively during active queue waiting times.

## 4. Moderation & Safety Reports

If a user is reported for violating community guidelines, our automated safety algorithms review technical log metadata (e.g. report timestamps, country codes, user callsigns) to issue temporary or permanent ip bans.

## 5. Contacting Us

If you have questions regarding this Privacy Policy, please contact our privacy desk at [legal@quiktalks.com](mailto:legal@quiktalks.com).
`,
    createdAt: Date.now(),
  },
  '/terms': {
    id: 'default_terms',
    title: 'Terms of Service - QuikTalks',
    slug: '/terms',
    content: `# Terms of Service for QuikTalks

**Effective Date:** January 1, 2026

Welcome to QuikTalks! By accessing or using our platform at \`https://www.quiktalks.com\`, you agree to be bound by these Terms of Service.

---

## 1. Age Requirement (18+)
You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to use QuikTalks. Minors are strictly prohibited.

## 2. Prohibited Conduct & Zero Tolerance Policy

QuikTalks maintains a strict zero-tolerance policy for abuse. You agree NOT to:
- Broadcast or engage in explicit, pornographic, or sexually explicit behavior.
- Harass, bully, threaten, hate speech, or intimidate any user.
- Spam, scam, or promote commercial links/affiliates without permission.
- Record, stream, or capture audio/text from other users without explicit mutual consent.

Violation of these terms will result in an immediate, permanent IP ban.

## 3. Disclaimer of Liability

QuikTalks provides random 1-on-1 stranger connections "as is". While we implement active moderation and AI safeguards, users interact at their own discretion.

## 4. Contact
For legal or compliance notices, please contact [legal@quiktalks.com](mailto:legal@quiktalks.com).
`,
    createdAt: Date.now(),
  },
  '/about': {
    id: 'default_about',
    title: 'About Us - QuikTalks Voice Chat Platform',
    slug: '/about',
    content: `# About QuikTalks

**QuikTalks** is a premier audio-first platform designed to connect people around the world for spontaneous, meaningful, and safe 1-on-1 voice conversations.

---

## 🎙️ Why Voice-First?

In an era dominated by video cameras, heavy filters, and social media pressure, authentic conversation has become rare. QuikTalks brings back the joy of real human connection through voice:

- **Zero Camera Pressure**: No need to worry about lighting, appearance, or video cameras.
- **Instant Global Matching**: Connect in under 3 seconds with strangers from over 190 countries.
- **Privacy First**: No accounts, no sign-ups, and encrypted peer-to-peer audio.

---

## 🌍 Our Mission

To create the safest, most accessible, and crystal-clear voice chat environment on the web—bringing humans closer together one conversation at a time.

[👉 Start Free Voice Call Now](https://www.quiktalks.com)
`,
    createdAt: Date.now(),
  },
  '/faq': {
    id: 'default_faq',
    title: 'Frequently Asked Questions (FAQ) - QuikTalks',
    slug: '/faq',
    content: `# Frequently Asked Questions (FAQ)

### Q1: Is QuikTalks free?
Yes! QuikTalks is 100% free with unlimited 1-on-1 voice calling and text chat options for all users worldwide.

### Q2: Do I need a camera or microphone app?
No camera needed! All you need is a working device microphone and any modern browser (Chrome, Safari, Edge, Firefox).

### Q3: How do country filters work?
Click the **Filters** button in the top navigation bar to select specific countries or regions you want to talk with or practice languages with native speakers.

### Q4: Is my conversation private?
Yes. Your calls use WebRTC peer-to-peer encryption and are never recorded or stored on our servers.
`,
    createdAt: Date.now(),
  }
};

// Aliases
DEFAULT_PAGES['/terms-of-service'] = DEFAULT_PAGES['/terms'];
DEFAULT_PAGES['/contact-us'] = DEFAULT_PAGES['/contact'];
DEFAULT_PAGES['/about-us'] = DEFAULT_PAGES['/about'];
