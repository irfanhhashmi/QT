import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Heading3, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  List, 
  ListOrdered, 
  Quote, 
  Eye, 
  Edit3, 
  Sparkles, 
  MousePointerClick,
  Code,
  FileCode
} from 'lucide-react';

interface RichContentEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export const RichContentEditor: React.FC<RichContentEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write content here...',
  minHeight = 'h-64',
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const insertFormat = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = document.getElementById('rich-editor-textarea') as HTMLTextAreaElement;
    if (!textarea) {
      onChange(value + `${prefix}${defaultText}${suffix}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || defaultText;
    const newText = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  const handleAddLink = () => {
    const url = prompt('Enter Web Link URL (e.g. https://www.quiktalks.com/about):', 'https://');
    if (!url || url === 'https://') return;
    const text = prompt('Enter Link Text (e.g. Visit QuikTalks About Page):', 'Click Here');
    insertFormat(`[${text || 'Link'}](${url})`, '', '');
  };

  const handleAddImage = () => {
    const url = prompt('Enter Image URL (e.g. https://images.unsplash.com/photo-1516321318423-f06f85e504b3):', 'https://');
    if (!url || url === 'https://') return;
    const alt = prompt('Enter Image Description / Alt Text:', 'QuikTalks Image');
    insertFormat(`![${alt || 'Image'}](${url})`, '', '');
  };

  const handleAddButton = () => {
    const url = prompt('Enter Call-to-Action Link URL:', 'https://www.quiktalks.com');
    if (!url || url === 'https://') return;
    const text = prompt('Enter Button Label (e.g. Start Free Call Now):', 'Get Started');
    insertFormat(`\n\n[👉 ${text || 'Click Here'}](${url})\n\n`, '', '');
  };

  const handleAddHtmlSnippet = () => {
    const rawHtml = prompt('Paste your raw HTML Code or Embed Snippet here:', '<div class="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl my-4 border border-cyan-500/30">\n  <h3 class="text-xl font-bold text-cyan-300">Custom HTML Title</h3>\n  <p>Add your custom HTML tags, embedded widgets, or custom layouts here!</p>\n</div>');
    if (!rawHtml) return;
    insertFormat(`\n\n${rawHtml}\n\n`, '', '');
  };

  const insertTemplate = (type: 'landing' | 'article' | 'faq' | 'html') => {
    if (value.trim() && !window.confirm('Replace current editor content with pre-built template?')) return;

    if (type === 'landing') {
      onChange(`# Welcome to QuikTalks SEO Portal

Welcome to the official **QuikTalks** portal for audio & text connections!

## Why Choose QuikTalks?
- **Instant Connections**: Talk with verified people globally in seconds.
- **Privacy Guaranteed**: No registration required to get started.
- **Crystal Clear Audio**: Optimized noise cancellation technology.

![QuikTalks Live Audio](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop)

### Explore Features
1. **Voice Match**: Connect via high-definition voice calls.
2. **Global Filters**: Select preferred region and topic tags.

[👉 Try QuikTalks Voice Matching Now](https://www.quiktalks.com)
`);
    } else if (type === 'article') {
      onChange(`# The Ultimate Guide to Online Connections in 2026

*Published by QuikTalks Editorial Team*

Communication is evolving rapidly. In this article, we explore how real-time audio conversations build deeper human connections.

> "A single 5-minute voice conversation creates stronger empathy than a week of back-and-forth texting."

## Key Takeaways
- Voice nuance builds instant trust.
- Global topic filters connect like-minded individuals.

### Next Steps
Learn more on our [About Us Page](https://www.quiktalks.com/about) or jump right into a live call.
`);
    } else if (type === 'faq') {
      onChange(`# Frequently Asked Questions

### Q1: Is QuikTalks free to use?
Yes! You can connect with conversational partners globally for free.

### Q2: How do I create dynamic pages or blogs?
Authorized administrators can publish content directly through the **Admin Console**.

### Q3: How do links and images work?
You can use the rich toolbar buttons above to add web links, images, headings, and lists easily!
`);
    } else if (type === 'html') {
      onChange(`<div class="p-6 bg-gradient-to-r from-[#0A1128] via-[#121E42] to-[#0A1128] border border-cyan-500/40 rounded-2xl shadow-xl text-white my-6">
  <h2 class="text-2xl font-bold text-cyan-400 mb-2">Custom HTML Banner</h2>
  <p class="text-slate-200 mb-4">You can write and embed full HTML tags directly inside this editor!</p>
  <a href="https://www.quiktalks.com" class="inline-block px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold rounded-xl transition-all shadow-md">
    Visit QuikTalks Portal &rarr;
  </a>
</div>

<p>You can mix standard Markdown with custom HTML tags like <code>&lt;div&gt;</code>, <code>&lt;iframe&gt;</code>, <code>&lt;table&gt;</code>, or custom styles seamlessly.</p>
`);
    }
  };

  return (
    <div className="bg-[#0A1128] border border-[#23356E] rounded-xl overflow-hidden">
      {/* Editor Header / Tabs & Toolbar */}
      <div className="bg-[#0E1733] border-b border-[#23356E] p-2 flex flex-wrap items-center justify-between gap-2">
        {/* Formatting Buttons */}
        <div className="flex items-center flex-wrap gap-1">
          <button
            type="button"
            onClick={() => insertFormat('**', '**', 'bold text')}
            title="Bold"
            className="p-2 hover:bg-[#1A264D] text-slate-300 hover:text-white rounded-lg transition-colors"
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => insertFormat('*', '*', 'italic text')}
            title="Italic"
            className="p-2 hover:bg-[#1A264D] text-slate-300 hover:text-white rounded-lg transition-colors"
          >
            <Italic className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-[#23356E] mx-1" />

          <button
            type="button"
            onClick={() => insertFormat('\n# ', '\n', 'Main Heading')}
            title="Heading 1"
            className="p-2 hover:bg-[#1A264D] text-slate-300 hover:text-white rounded-lg transition-colors font-bold text-xs"
          >
            <Heading1 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => insertFormat('\n## ', '\n', 'Subheading')}
            title="Heading 2"
            className="p-2 hover:bg-[#1A264D] text-slate-300 hover:text-white rounded-lg transition-colors font-bold text-xs"
          >
            <Heading2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => insertFormat('\n### ', '\n', 'Section Title')}
            title="Heading 3"
            className="p-2 hover:bg-[#1A264D] text-slate-300 hover:text-white rounded-lg transition-colors font-bold text-xs"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-[#23356E] mx-1" />

          <button
            type="button"
            onClick={handleAddLink}
            title="Insert Web Link"
            className="p-2 bg-cyan-900/30 hover:bg-cyan-800/50 text-cyan-300 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
          >
            <LinkIcon className="w-4 h-4" />
            + Link
          </button>

          <button
            type="button"
            onClick={handleAddImage}
            title="Insert Image"
            className="p-2 bg-purple-900/30 hover:bg-purple-800/50 text-purple-300 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
          >
            <ImageIcon className="w-4 h-4" />
            + Image
          </button>

          <button
            type="button"
            onClick={handleAddButton}
            title="Insert Call-to-Action Button"
            className="p-2 bg-emerald-900/30 hover:bg-emerald-800/50 text-emerald-300 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
          >
            <MousePointerClick className="w-4 h-4" />
            + CTA Button
          </button>

          <button
            type="button"
            onClick={handleAddHtmlSnippet}
            title="Embed Raw HTML Code"
            className="p-2 bg-amber-900/30 hover:bg-amber-800/50 text-amber-300 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold border border-amber-500/30"
          >
            <FileCode className="w-4 h-4" />
            + HTML Code
          </button>

          <div className="h-4 w-px bg-[#23356E] mx-1" />

          <button
            type="button"
            onClick={() => insertFormat('\n- ', '\n- ', 'Bullet List Item')}
            title="Bullet List"
            className="p-2 hover:bg-[#1A264D] text-slate-300 hover:text-white rounded-lg transition-colors"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => insertFormat('\n1. ', '\n2. ', 'Numbered List Item')}
            title="Numbered List"
            className="p-2 hover:bg-[#1A264D] text-slate-300 hover:text-white rounded-lg transition-colors"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => insertFormat('\n> ', '\n', 'Quote text here')}
            title="Blockquote"
            className="p-2 hover:bg-[#1A264D] text-slate-300 hover:text-white rounded-lg transition-colors"
          >
            <Quote className="w-4 h-4" />
          </button>

          {/* Quick Template Dropdown */}
          <div className="relative group ml-1">
            <button
              type="button"
              className="p-1.5 px-2 bg-[#1A264D] hover:bg-[#23356E] text-amber-300 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1 border border-amber-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Templates
            </button>
            <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-[#0E1733] border border-[#23356E] rounded-xl p-1.5 shadow-2xl z-20 w-44">
              <button
                type="button"
                onClick={() => insertTemplate('landing')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 rounded-lg"
              >
                🚀 Landing Page
              </button>
              <button
                type="button"
                onClick={() => insertTemplate('article')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 rounded-lg"
              >
                📰 SEO Article
              </button>
              <button
                type="button"
                onClick={() => insertTemplate('faq')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 rounded-lg"
              >
                ❓ FAQ Section
              </button>
              <button
                type="button"
                onClick={() => insertTemplate('html')}
                className="w-full text-left px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-500/20 rounded-lg font-semibold"
              >
                💻 Custom HTML Page
              </button>
            </div>
          </div>
        </div>

        {/* View Toggle (Edit vs Live Preview) */}
        <div className="flex items-center gap-1 bg-[#0A1128] p-1 rounded-lg border border-[#23356E]">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${
              activeTab === 'edit'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${
              activeTab === 'preview'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Live Preview
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {activeTab === 'edit' ? (
        <textarea
          id="rich-editor-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full p-4 bg-[#0A1128] text-white placeholder-slate-500 font-mono text-sm focus:outline-none resize-y ${minHeight}`}
        />
      ) : (
        <div className={`p-6 bg-[#0E1733] overflow-y-auto max-w-none ${minHeight}`}>
          {!value.trim() ? (
            <p className="text-slate-500 text-sm italic">Nothing to preview. Type content or use templates above.</p>
          ) : (
            <div className="prose prose-invert max-w-none text-slate-200">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-3xl font-extrabold text-white mb-4 mt-2 border-b border-[#23356E] pb-2" {...props} />,
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
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg my-2 no-underline"
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
                        className="text-cyan-400 hover:text-cyan-300 underline font-medium"
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
                {value}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
