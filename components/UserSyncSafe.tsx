// components/UserSyncSafe.tsx - VERSION YANG LEBIH AMAN
"use client";

import { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

export default function UserSyncSafe() {
  const [user] = useAuthState(auth);

  useEffect(() => {
    const syncUserToFirestore = async () => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          // Jika user sudah ada di Firestore, skip sync untuk menghindari overwrite role
          if (userSnap.exists()) {
            console.log("ℹ️ User already exists in Firestore, skipping sync to preserve role");
            return;
          }

          // Hanya sync user baru yang belum ada di Firestore
          console.log("🔄 Syncing NEW user to Firestore:", user.uid);
          
          const githubProfile = user.providerData.find(p => p.providerId === "github.com");
          const githubUsername = githubProfile?.displayName || 
                                user.displayName?.replace(/\s+/g, '') || 
                                user.email?.split('@')[0] || 
                                "";

          const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "Anonim",
            photoURL: user.photoURL || "/default-avatar.png",
            provider: user.providerData[0]?.providerId || "unknown",
            githubUsername: githubUsername,
            githubUrl: githubUsername ? `https://github.com/${githubUsername}` : "",
            role: 'user', // Default role untuk user baru
            lastLogin: serverTimestamp(),
            createdAt: serverTimestamp()
          };

          await setDoc(userRef, userData, { merge: true });
          console.log("✅ New user data synced to Firestore:", user.uid);
          
        } catch (error) {
          console.error("❌ Error syncing user data:", error);
        }
      }
    };

    syncUserToFirestore();
  }, [user]);

  return null;
}