import { signInWithPopup, signOut } from "firebase/auth";
import { auth, provider, db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

export const loginWithGitHub = async () => {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Ambil info dari provider GitHub (resmi)
  const githubProfile = user.providerData.find(
    (p) => p.providerId === "github.com"
  );
  const githubUsername = githubProfile?.uid;
  const githubUrl = githubUsername ? `https://github.com/${githubUsername}` : "";

  await setDoc(
    doc(db, "users", user.uid),
    {
      name: user.displayName,
      email: user.email,
      avatar: user.photoURL,
      githubUrl,
      uid: user.uid,
      createdAt: new Date(),
    },
    { merge: true }
  );

  return user;
};

export const logout = async () => {
  await signOut(auth);
};
