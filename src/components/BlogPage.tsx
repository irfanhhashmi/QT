import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, doc, setDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { useRole } from '../context/RoleContext';
import { RichContentEditor } from './RichContentEditor';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth();
const provider = new GoogleAuthProvider();

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const BlogPage: React.FC<{ initialSlug?: string }> = ({ initialSlug }) => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const { user, role } = useRole();

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setBlogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'blogs');
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      // Initialize profile if it doesn't exist
      if (auth.currentUser) {
        await setDoc(doc(db, 'userProfiles', auth.currentUser.uid), {
          uid: auth.currentUser.uid,
          role: 'owner' // Setting as owner for the user
        }, { merge: true });
      }
    } catch (error: any) {
      if (error.code !== 'auth/cancelled-popup-request') {
        console.error('Login error:', error);
      }
    }
  };

  const handlePost = async () => {
    if (!user || (role !== 'owner' && role !== 'editor')) return;
    try {
      await addDoc(collection(db, 'blogs'), {
        title,
        category,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        content,
        authorId: user.uid,
        createdAt: Date.now(),
        likesCount: 0
      });
      setTitle('');
      setCategory('');
      setContent('');
      fetchBlogs();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'blogs');
    }
  };

  const handleDelete = async (id: string, authorId: string) => {
    console.log('Attempting to delete:', id, 'Author:', authorId, 'User:', user?.uid, 'Role:', role);
    if (role !== 'owner' && user?.uid !== authorId) return;
    try {
      await deleteDoc(doc(db, 'blogs', id));
      fetchBlogs();
    } catch (error) {
      console.error('Delete error:', error);
      handleFirestoreError(error, OperationType.DELETE, 'blogs');
    }
  };

  const handleLike = async (blogId: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'blogs', blogId, 'likes', user.uid), { blogId, userId: user.uid });
      await updateDoc(doc(db, 'blogs', blogId), { likesCount: increment(1) });
      fetchBlogs();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'blogs');
    }
  };

  const [newComment, setNewComment] = useState<{[key: string]: string}>({});

  const handleAddComment = async (blogId: string) => {
    if (!user || !newComment[blogId]) return;
    try {
      await addDoc(collection(db, 'blogs', blogId, 'comments'), {
        text: newComment[blogId],
        authorId: user.uid,
        createdAt: Date.now()
      });
      setNewComment(prev => ({ ...prev, [blogId]: '' }));
      fetchBlogs();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'comments');
    }
  };

  return (
    <div className="p-4 text-white">
      <h1 className="text-2xl font-bold mb-4">Blogs</h1>
      {!user ? (
        <button onClick={handleLogin} className="bg-blue-500 p-2 rounded">Login to Post</button>
      ) : (role === 'owner' || role === 'editor' || role === 'admin') ? (
        <div className="mb-8 p-6 bg-[#0E1733] rounded-2xl border border-[#23356E] shadow-xl">
          <h2 className="text-xl font-bold mb-4 text-white">Create New Blog Post</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Blog Title" 
              className="p-3 rounded-xl bg-[#0A1128] text-white border border-[#23356E] focus:outline-none focus:border-cyan-500 text-sm font-medium" 
            />
            <input 
              value={category} 
              onChange={(e) => setCategory(e.target.value)} 
              placeholder="Category (e.g. SEO, Updates, Technology)" 
              className="p-3 rounded-xl bg-[#0A1128] text-white border border-[#23356E] focus:outline-none focus:border-cyan-500 text-sm font-medium" 
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-xs text-slate-400 font-semibold uppercase mb-1">Content & Visual Formatting</label>
            <RichContentEditor
              value={content}
              onChange={setContent}
              placeholder="Write blog content... Use the toolbar above to add web links, images, headings, CTA buttons, or load templates."
              minHeight="h-64"
            />
          </div>

          <button onClick={handlePost} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all">Publish Blog Post</button>
        </div>
      ) : null}
      <div className="space-y-6">
        {blogs.filter(b => !initialSlug || b.slug === initialSlug).map(blog => (
          <article key={blog.id} className="bg-[#0E1733] p-6 rounded-2xl border border-[#1E294A]">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">{blog.category}</span>
            <h2 className="text-2xl font-bold text-white mb-3">{blog.title}</h2>
            <div className="text-slate-300 leading-relaxed mb-6 max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  p: ({node, ...props}) => <p className="mb-4 text-slate-300 leading-relaxed" {...props} />,
                  h1: ({node, ...props}) => <h1 className="text-3xl font-extrabold text-white mb-4 mt-2 border-b border-[#23356E] pb-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-white mb-3 mt-6 border-b border-[#23356E]/50 pb-1" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-xl font-bold text-cyan-300 mb-2 mt-4" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 text-slate-300 space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 text-slate-300 space-y-1" {...props} />,
                  li: ({node, ...props}) => <li className="mb-1 text-slate-300" {...props} />,
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
                  strong: ({node, ...props}) => <strong className="font-bold text-white bg-blue-900/50 px-1 rounded" {...props} />,
                  em: ({node, ...props}) => <em className="italic text-cyan-200" {...props} />,
                  code: ({node, ...props}) => <code className="bg-[#0A1128] border border-[#23356E] text-cyan-300 px-1 py-0.5 rounded font-mono text-sm" {...props} />,
                }}
              >{blog.content}</ReactMarkdown>
            </div>
            <div className="flex items-center gap-4 pt-4 border-t border-[#1E294A]">
              <button onClick={() => handleLike(blog.id)} className="text-sm text-slate-300 hover:text-white flex items-center gap-1.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                {blog.likesCount || 0}
              </button>
              {role === 'owner' && <button onClick={() => handleDelete(blog.id, blog.authorId)} className="text-sm text-red-400 hover:text-red-300">Delete</button>}
            </div>
            {user && (
              <div className="flex gap-2 mt-4">
                <input value={newComment[blog.id] || ''} onChange={(e) => setNewComment(prev => ({ ...prev, [blog.id]: e.target.value }))} placeholder="Comment..." className="flex-1 p-2 text-white bg-[#0A1128] rounded-xl border border-[#23356E]" />
                <button onClick={() => handleAddComment(blog.id)} className="text-sm bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-xl">Post</button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
};
