// /lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
// import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GithubAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration menggunakan environment variables untuk keamanan
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const provider = new GithubAuthProvider();

// Request user profile information
provider.addScope("read:user");
provider.addScope("user:email");

export const loginWithGitHub = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result;
  } catch (error: any) {
    // Jangan expose error details ke console di production
    if (process.env.NODE_ENV === "development") {
      console.error("Login error:", error);
    }
    throw new Error(error?.message || "Login failed");
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Logout error:", error);
    }
    throw new Error(error?.message || "Logout failed");
  }
};
