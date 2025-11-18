import { signInWithPopup, signOut, GithubAuthProvider } from "firebase/auth";
import { auth, provider, db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import { sanitizeInput, isValidUrl } from "./security";

export const loginWithGitHub = async () => {
  try {
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

        if (!response.ok) {
          throw new Error("Failed to fetch GitHub user data");
        }

        const githubData = await response.json();
        githubUsername = githubData.login || ""; // login adalah username GitHub
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching GitHub username:", error);
        }
        // Fallback ke email jika gagal
        githubUsername = user.email?.split("@")[0] || "";
      }
    }

    const githubUrl = githubUsername ? `https://github.com/${githubUsername}` : "";

    // Validate GitHub URL
    const validGithubUrl = githubUrl && isValidUrl(githubUrl) ? githubUrl : "";

    // Sanitize user data
    const userData = {
      name: sanitizeInput(user.displayName || ""),
      email: sanitizeInput(user.email || ""),
      avatar: user.photoURL || "",
      githubUrl: validGithubUrl,
      githubUsername: sanitizeInput(githubUsername),
      uid: user.uid,
      createdAt: new Date(),
    };

    await setDoc(doc(db, "users", user.uid), userData, { merge: true });

    return user;
  } catch (error: any) {
    // Jangan expose error details di production
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
