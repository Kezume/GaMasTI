"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth, provider } from "@/lib/firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { FiLogOut, FiGithub } from "react-icons/fi";
import { motion } from "framer-motion";

export default function AuthButton() {
  const [user] = useAuthState(auth);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login gagal:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (!user) {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleLogin}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition"
      >
        <FiGithub className="text-lg" />
        <span>Login dengan GitHub</span>
      </motion.button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Avatar + Nama */}
      <div className="flex items-center gap-2 bg-[#1a1a1a] border border-gray-800 px-3 py-1.5 rounded-full">
        <img
          src={user.photoURL || "/default-avatar.png"}
          alt="User avatar"
          className="w-7 h-7 rounded-full"
        />
        <span className="text-sm text-gray-200 font-medium">
          {user.displayName || "User"}
        </span>
      </div>

      {/* Tombol Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition"
        title="Logout"
      >
        <FiLogOut className="text-lg" />
      </button>
    </div>
  );
}
