"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

export default function BlogForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [user] = useAuthState(auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Harus login dulu");

    // Ambil data GitHub dari providerData
    const githubProfile = user.providerData.find(
      (p) => p.providerId === "github.com"
    );
    const githubUsername = githubProfile?.uid;
    const githubUrl = githubUsername ? `https://github.com/${githubUsername}` : "";

    await addDoc(collection(db, "blogs"), {
      title,
      content,
      authorId: user.uid,
      authorName: user.displayName,
      authorAvatar: user.photoURL,
      githubUrl,
      createdAt: serverTimestamp(),
    });

    setTitle("");
    setContent("");
    alert("Blog berhasil ditambahkan!");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Judul blog"
        className="p-2 border rounded"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Isi blog..."
        className="p-2 border rounded"
      />
      <button type="submit" className="bg-blue-600 text-white py-2 rounded">
        Tambahkan
      </button>
    </form>
  );
}
