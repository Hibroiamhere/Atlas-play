
'use client';

// NO IMPORTS from 'firebase/app', 'firebase/auth', or '../lib/firebase' should be present here.

import type { Dispatch, SetStateAction } from 'react';
import { createContext, useContext, type ReactNode, useState, useEffect } from 'react';

// THIS IS A STUB AuthContext. FIREBASE AUTHENTICATION HAS BEEN REMOVED.
// This context provides default, non-functional values and logs warnings if used.
// PlayerContext (from PlayerContext.tsx) is now used for player name management.
// This file should ideally not be imported or used anywhere.

interface StubUser {
  uid: string;
  displayName: string | null;
}

interface AuthContextType {
  user: StubUser | null;
  loading: boolean;
  login: () => Promise<void>;
  signup: () => Promise<void>;
  logout: () => Promise<void>;
  userId: string | null;
  setUserId: Dispatch<SetStateAction<string | null>>;
  isUserPro: boolean;
  setIsUserPro: Dispatch<SetStateAction<boolean>>;
  userName: string | null;
  setUserName: Dispatch<SetStateAction<string | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  console.warn(
    'CRITICAL DEPRECATION: AuthProvider from AuthContext.tsx is STILL BEING USED. ' +
    'Firebase Authentication has been removed. PlayerProvider from PlayerContext.tsx should be used instead. ' +
    'Please update your src/app/layout.tsx immediately to use PlayerProvider.'
  );

  // Provide minimal state to prevent crashes if children expect some context values.
  const [userId, setUserId] = useState<string | null>(null);
  const [isUserPro, setIsUserPro] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);


  const mockAuthContext: AuthContextType = {
    user: null,
    loading: false, // Keep loading false as no auth operations are happening
    login: async () => {
      console.warn('DEPRECATED: login function from AuthContext called. Firebase Auth is removed.');
    },
    signup: async () => {
      console.warn('DEPRECATED: signup function from AuthContext called. Firebase Auth is removed.');
    },
    logout: async () => {
      console.warn('DEPRECATED: logout function from AuthContext called. Firebase Auth is removed.');
    },
    userId,
    setUserId: (value) => {
        console.warn('DEPRECATED: setUserId function from AuthContext called. Firebase Auth is removed.');
        setUserId(value);
    },
    isUserPro,
    setIsUserPro: (value) => {
        console.warn('DEPRECATED: setIsUserPro function from AuthContext called. Firebase Auth is removed.');
        setIsUserPro(value);
    },
    userName,
    setUserName: (value) => {
        console.warn('DEPRECATED: setUserName function from AuthContext called. Firebase Auth is removed.');
        setUserName(value);
    }
  };

  return (
    <AuthContext.Provider value={mockAuthContext}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  // This hook should ideally not be called anywhere.
  
  useEffect(() => {
    // This warning will appear in the client console if useAuth is called.
    console.warn(
      'CRITICAL DEPRECATION: useAuth hook from AuthContext.tsx is being used. ' +
      'Firebase Auth functionality has been removed. Migrate to usePlayer from PlayerContext.tsx.'
    );
  },[]);


  if (context === undefined) {
    // To prevent hard crashes if it's still called without a provider somehow
    // This might happen during server rendering if AuthProvider isn't in the tree.
    console.error(
        'CRITICAL DEPRECATION: useAuth hook called outside of an AuthProvider, ' +
        'or AuthProvider is missing from the component tree. AuthContext is deprecated. ' +
        'Ensure PlayerProvider is used in layout.tsx and usePlayer is used in components.'
    );
    return {
      user: null, loading: false,
      login: async () => { console.warn('DEPRECATED: login (fallback) from AuthContext called.'); },
      signup: async () => { console.warn('DEPRECATED: signup (fallback) from AuthContext called.'); },
      logout: async () => { console.warn('DEPRECATED: logout (fallback) from AuthContext called.'); },
      userId: null, setUserId: () => { console.warn('DEPRECATED: setUserId (fallback) from AuthContext called.'); },
      isUserPro: false, setIsUserPro: () => { console.warn('DEPRECATED: setIsUserPro (fallback) from AuthContext called.'); },
      userName: null, setUserName: () => { console.warn('DEPRECATED: setUserName (fallback) from AuthContext called.'); },
    } as AuthContextType;
  }
  return context;
}
