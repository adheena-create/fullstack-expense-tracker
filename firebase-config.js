/**
 * Firebase Configuration File
 * 
 * Instructions:
 * 1. Go to the Firebase Console: https://console.firebase.google.com/
 * 2. Create a new project (or select an existing one).
 * 3. Add a Web App to your project (click the Web icon </>).
 * 4. Copy the config object values provided by Firebase into the empty strings below.
 * 5. Save this file and reload the application.
 * 
 * If these values are left empty, the application will display a setup guidance
 * screen instead of crashing or failing silently.
 */

export const firebaseConfig = {
  apiKey: "AIzaSyBf2AZJfKSlAiGyLrHIMG4eGA2rZy-LxbI",
  authDomain: "expence-calculator-dedf8.firebaseapp.com",
  projectId: "expence-calculator-dedf8",
  storageBucket: "expence-calculator-dedf8.firebasestorage.app",
  messagingSenderId: "402253759120",
  appId: "1:402253759120:web:1b4fc02f5c5fb256014e15",
  measurementId: "G-BBE9PCE9J1"
};

/**
 * Validates whether the Firebase configuration has been populated by the user.
 * Returns true only if all critical fields are non-empty strings.
 */
export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey.trim() !== "" &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId.trim() !== "" &&
    firebaseConfig.appId &&
    firebaseConfig.appId.trim() !== ""
  );
}
