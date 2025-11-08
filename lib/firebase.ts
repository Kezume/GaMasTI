// /lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
// import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GithubAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAOxyuuoJ6cjRWaTK8_wR25quV4gy3dBVQ",
  authDomain: "gamasti-39241.firebaseapp.com",
  projectId: "gamasti-39241",
  storageBucket: "gamasti-39241.firebasestorage.app",
  messagingSenderId: "891109580101",
  appId: "1:891109580101:web:e09e5b5db50502f4d1722c",
  measurementId: "G-WX8X7B4GJG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const provider = new GithubAuthProvider();

export const loginWithGitHub = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Login error:", error);
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
  }
};