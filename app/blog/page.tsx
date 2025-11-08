"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import Link from "next/link";

interface Blog {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorAvatar: string;
  githubUrl: string;
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    const fetchBlogs = async () => {
      const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setBlogs(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Blog[]);
    };
    fetchBlogs();
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Berita & Karya Mahasiswa</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {blogs.map((b) => (
          <Link
            href={`/blog/${b.id}`}
            key={b.id}
            className="bg-gray-900 p-5 rounded-xl border border-gray-800 hover:border-blue-600 transition"
          >
            <h2 className="font-semibold text-lg mb-2">{b.title}</h2>
            <p className="text-gray-400 text-sm mb-4 line-clamp-3">{b.content}</p>

            <div className="flex items-center gap-2 mt-auto">
              <img
                src={b.authorAvatar}
                alt={b.authorName}
                className="w-8 h-8 rounded-full"
              />
              <div className="text-sm">
                <p className="font-medium">{b.authorName}</p>
                <a
                  href={b.githubUrl}
                  target="_blank"
                  className="text-blue-400 hover:underline"
                >
                  GitHub
                </a>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
