"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { auth, provider } from "@/lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setUser(user));
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <nav className="flex justify-between items-center p-4 bg-gray-900 text-white">
      <Link href="/" className="text-xl font-bold">🎓 Galeri TI</Link>
      <div className="space-x-4">
        {user ? (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <button onClick={handleLogin}>Login with GitHub</button>
        )}
      </div>
    </nav>
  );
}
