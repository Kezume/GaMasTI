import { signInWithPopup, signOut, GithubAuthProvider } from "firebase/auth";
import { auth, provider, db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

export const loginWithGitHub = async () => {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Ambil access token dari credential
  const credential = GithubAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken;

  let githubUsername = "";

  // Ambil username langsung dari GitHub API
  if (accessToken) {
    try {
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const githubData = await response.json();
      githubUsername = githubData.login || ""; // login adalah username GitHub
    } catch (error) {
      console.error("Error fetching GitHub username:", error);
      // Fallback ke email jika gagal
      githubUsername = user.email?.split("@")[0] || "";
    }
  }

  const githubUrl = githubUsername ? `https://github.com/${githubUsername}` : "";

  await setDoc(
    doc(db, "users", user.uid),
    {
      name: user.displayName,
      email: user.email,
      avatar: user.photoURL,
      githubUrl,
      githubUsername, // Simpan username GitHub yang asli
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
