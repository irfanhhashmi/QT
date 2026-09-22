import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth();
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

interface RoleContextType {
  user: any;
  role: string | null;
  loading: boolean;
  authError: string | null;
  signInWithGooglePopup: () => Promise<void>;
  signInWithGoogleRedirect: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithMasterPasscode: (input: string) => Promise<boolean>;
  clearAuthError: () => void;
  signOutUser: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType>({
  user: null,
  role: null,
  loading: true,
  authError: null,
  signInWithGooglePopup: async () => {},
  signInWithGoogleRedirect: async () => {},
  signInWithEmail: async () => {},
  loginWithMasterPasscode: async () => false,
  clearAuthError: () => {},
  signOutUser: async () => {},
});

const MASTER_OWNER_EMAIL = 'irfanhhashmi@gmail.com';
const MASTER_PASSCODES = ['irfanhhashmi@gmail.com', 'IrfanAdmin2026!', 'QuikTalks2026', 'admin'];

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Helper to resolve role by email or UID from Firestore
  const resolveUserRole = async (userObj: any) => {
    const email = userObj.email?.toLowerCase().trim();
    if (email === MASTER_OWNER_EMAIL.toLowerCase()) {
      return 'owner';
    }

    try {
      // 1. Direct UID doc
      if (userObj.uid) {
        const profileDoc = await getDoc(doc(db, 'userProfiles', userObj.uid));
        if (profileDoc.exists() && profileDoc.data().role) {
          return profileDoc.data().role;
        }
      }

      // 2. Direct email doc ID (sanitized)
      if (email) {
        const cleanId = email.replace(/[^a-zA-Z0-9]/g, '_');
        const emailDoc = await getDoc(doc(db, 'userProfiles', cleanId));
        if (emailDoc.exists() && emailDoc.data().role) {
          return emailDoc.data().role;
        }

        // 3. Query collection by email field
        const q = query(collection(db, 'userProfiles'), where('email', '==', email));
        const qSnap = await getDocs(q);
        if (!qSnap.empty && qSnap.docs[0].data().role) {
          return qSnap.docs[0].data().role;
        }
      }
    } catch (err) {
      console.error('Error resolving user role:', err);
    }

    return email === MASTER_OWNER_EMAIL.toLowerCase() ? 'owner' : 'writer';
  };

  useEffect(() => {
    // 1. Check local saved session first
    const savedMasterSession = localStorage.getItem('quiktalks_master_admin_session');
    if (savedMasterSession) {
      try {
        const parsed = JSON.parse(savedMasterSession);
        if (parsed && parsed.email) {
          setUser(parsed);
          setRole(parsed.role || 'owner');
          setLoading(false);
        }
      } catch (e) {
        localStorage.removeItem('quiktalks_master_admin_session');
      }
    }

    // Process redirect result if returning from signInWithRedirect
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('Redirect sign-in successful:', result.user.email);
        }
      })
      .catch((err) => {
        console.error('Redirect result error:', err);
        setAuthError(err.message || 'Redirect sign-in failed');
      });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // If local master session exists, preserve it unless explicitly signed out
      if (localStorage.getItem('quiktalks_master_admin_session')) {
        setLoading(false);
        return;
      }

      setUser(currentUser);
      if (currentUser) {
        const resolvedRole = await resolveUserRole(currentUser);
        setRole(resolvedRole);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Passcode / Email Instant Login Function
  const loginWithMasterPasscode = async (input: string): Promise<boolean> => {
    const trimmed = input.trim().toLowerCase();
    
    // Case 1: Master owner passcode or master email
    if (MASTER_PASSCODES.some(p => p.toLowerCase() === trimmed)) {
      const masterUser = {
        uid: 'master-owner-' + Date.now(),
        email: MASTER_OWNER_EMAIL,
        displayName: 'Master Owner',
        role: 'owner',
      };
      setUser(masterUser);
      setRole('owner');
      localStorage.setItem('quiktalks_master_admin_session', JSON.stringify(masterUser));
      setAuthError(null);
      return true;
    }

    // Case 2: Check if input is an authorized admin/editor email in Firestore
    if (trimmed.includes('@')) {
      const checkedRole = await resolveUserRole({ email: trimmed });
      if (checkedRole === 'owner' || checkedRole === 'admin' || checkedRole === 'editor') {
        const adminUser = {
          uid: 'admin-user-' + trimmed.replace(/[^a-zA-Z0-9]/g, '_'),
          email: trimmed,
          displayName: trimmed.split('@')[0],
          role: checkedRole,
        };
        setUser(adminUser);
        setRole(checkedRole);
        localStorage.setItem('quiktalks_master_admin_session', JSON.stringify(adminUser));
        setAuthError(null);
        return true;
      }
    }

    setAuthError('Access Denied. Passcode or Email is not authorized as an Administrator.');
    return false;
  };

  const signInWithGooglePopup = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.warn('Popup sign in failed or blocked:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setAuthError('Popup blocked. Use the Passcode / Email login box below for instant access.');
      } else {
        setAuthError(err.message || 'Sign in failed');
      }
    }
  };

  const signInWithGoogleRedirect = async () => {
    setAuthError(null);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err: any) {
      console.error('Redirect sign in error:', err);
      setAuthError(err.message || 'Redirect sign in failed');
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      setAuthError(err.message || 'Email authentication failed. Try logging in with Passcode / Email above.');
    }
  };

  const clearAuthError = () => setAuthError(null);

  const signOutUser = async () => {
    setAuthError(null);
    localStorage.removeItem('quiktalks_master_admin_session');
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setUser(null);
    setRole(null);
  };

  return (
    <RoleContext.Provider value={{ 
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
    }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => useContext(RoleContext);



