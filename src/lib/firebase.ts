
// This file is intentionally left almost empty.
// Firebase Authentication has been REMOVED from this application.
// NO Firebase app or auth services should be initialized or used from this file.

// The following exports are STUBS. They are undefined to prevent runtime errors
// if legacy code (which should be updated) still attempts to import them.
export const app = undefined;
export const auth = undefined;

// DO NOT ADD FIREBASE INITIALIZATION CODE (initializeApp, firebaseConfig, getAuth) HERE.
// DO NOT ADD IMPORTS for 'firebase/app' or 'firebase/auth'.

// If you are seeing errors like "Firebase: Error (auth/invalid-api-key)",
// it means some part of your application is STILL trying to initialize Firebase Auth,
// likely because an older version of this file or AuthContext.tsx is being cached or used.
// Ensure:
// 1. AuthProvider in src/app/layout.tsx has been REPLACED with PlayerProvider.
// 2. src/context/AuthContext.tsx is fully stubbed out and does not call Firebase.
// 3. You have FULLY RESTARTED your Next.js development server after these changes.
