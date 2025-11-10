// lib/userSync.ts
import { auth, db } from "./firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export const syncUserToFirestore = async (user: any) => {
  if (!user) return null;

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    // Extract GitHub data
    const githubProfile = user.providerData.find((p: any) => p.providerId === "github.com");
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
      role: userSnap.exists() ? userSnap.data().role : 'user', // Pertahankan role jika sudah ada
      lastLogin: serverTimestamp(),
      createdAt: userSnap.exists() ? userSnap.data().createdAt : serverTimestamp()
    };

    await setDoc(userRef, userData, { merge: true });
    console.log("User data synced to Firestore:", user.uid);
    return userData;
  } catch (error) {
    console.error("Error syncing user to Firestore:", error);
    throw error;
  }
};

// Initialize user sync on auth state change
export const initUserSync = () => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        await syncUserToFirestore(user);
      } catch (error) {
        console.error("Failed to sync user on auth state change:", error);
      }
    }
  });
};