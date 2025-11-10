// components/UserSync.tsx
"use client";

import { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { syncUserToFirestore } from "@/lib/userSync";

export default function UserSync() {
  const [user] = useAuthState(auth);

  useEffect(() => {
    const syncUser = async () => {
      if (user) {
        try {
          console.log("Syncing user to Firestore:", user.uid);
          console.log("User provider data:", user.providerData);
          
          const githubProfile = user.providerData.find(p => p.providerId === "github.com");
          console.log("GitHub profile:", githubProfile);
          
          await syncUserToFirestore(user);
        } catch (error) {
          console.error("Error in UserSync component:", error);
        }
      }
    };

    syncUser();
  }, [user]);

  return null; // Component ini tidak render apapun
}