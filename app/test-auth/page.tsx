// app/test-auth/page.tsx
"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

export default function TestAuth() {
  const [user, loading, error] = useAuthState(auth);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test</h1>
      
      {error && <div className="text-red-500">Error: {error.message}</div>}
      
      {user ? (
        <div className="space-y-4">
          <div>UID: {user.uid}</div>
          <div>Email: {user.email}</div>
          <div>Display Name: {user.displayName}</div>
          <div>Photo URL: {user.photoURL}</div>
          <div>Providers: {user.providerData.map(p => p.providerId).join(", ")}</div>
          
          {user.providerData.map((provider, index) => (
            <div key={index} className="border p-4">
              <div>Provider: {provider.providerId}</div>
              <div>UID: {provider.uid}</div>
              <div>Display Name: {provider.displayName}</div>
              <div>Email: {provider.email}</div>
              <div>Photo URL: {provider.photoURL}</div>
            </div>
          ))}
        </div>
      ) : (
        <div>No user logged in</div>
      )}
    </div>
  );
}