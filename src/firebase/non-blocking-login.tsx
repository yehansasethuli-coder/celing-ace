
'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): Promise<void> {
  // Call signInAnonymously and return the promise chain.
  return signInAnonymously(authInstance)
    .then(() => {
      // Successfully signed in. The onAuthStateChanged listener will handle the user state update.
    })
    .catch((error) => {
      // Handle or log specific anonymous sign-in errors if necessary.
      console.error("Anonymous sign-in failed:", error);
    });
}
