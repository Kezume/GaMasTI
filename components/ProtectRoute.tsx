"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/"); // redirect ke home kalau belum login
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="text-center py-10 text-gray-400">Memuat...</div>;
  }

  return <>{children}</>;
}
