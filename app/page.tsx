"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import Link from "next/link";
import { motion } from "framer-motion";
import AuthButton from "@/components/AuthButton";
import { FiPlusCircle, FiGithub } from "react-icons/fi";

interface Blog {
  id: string;
  title: string;
  content: string;
  images?: string[];
  authorName?: string;
  authorAvatar?: string;
  authorGithub?: string;
  createdAt?: { seconds: number };
}

export default function HomePage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [user] = useAuthState(auth);

  useEffect(() => {
    const fetchBlogs = async () => {
      const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Blog[];
      setBlogs(data);
    };
    fetchBlogs();
  }, []);

  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white flex flex-col">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#0d0d0d]/90 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold tracking-wide">
            <span className="text-blue-500">TI</span> GALLERY
          </Link>
          <AuthButton />
        </div>
      </header>

      {/* HERO */}
      <section className="flex flex-col items-center justify-center text-center mt-32 px-6">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl sm:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-300 bg-clip-text text-transparent"
        >
          Galeri Mahasiswa TI
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-gray-400 text-lg max-w-2xl mb-12"
        >
          Temukan karya, artikel, dan proyek inspiratif dari mahasiswa Teknik Informatika —
          berbagi ilmu, berbagi semangat.
        </motion.p>
      </section>

      {/* BLOG LIST */}
      <section className="max-w-7xl mx-auto mt-10 px-6 pb-24 w-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-gray-100">
            📰 Berita & Karya Terbaru
          </h2>

          {/* ✅ Tombol tambah blog */}
          {user && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-all"
            >
              <FiPlusCircle className="text-lg" /> Tambah Blog
            </Link>
          )}
        </div>

        {blogs.length === 0 ? (
          <p className="text-gray-500 text-center">
            Belum ada blog yang dipublikasikan.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {blogs.map((blog, i) => (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group bg-[#141414] border border-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-blue-900/30 transition-all duration-300 hover:-translate-y-1"
              >
                {/* IMAGE */}
                {blog.images && blog.images.length > 0 ? (
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={blog.images[0]}
                      alt={blog.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ) : (
                  <div className="h-56 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center text-gray-600 italic">
                    Tidak ada gambar
                  </div>
                )}

                {/* CONTENT */}
                <div className="p-5 flex flex-col justify-between h-[220px]">
                  <div>
                    <h3 className="font-semibold text-xl mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                      {blog.content}
                    </p>
                  </div>

                  {/* AUTHOR + LINK */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      {blog.authorAvatar && (
                        <img
                          src={blog.authorAvatar}
                          alt={blog.authorName}
                          className="w-6 h-6 rounded-full"
                        />
                      )}

                      {blog.authorGithub ? (
                        <a
                          href={blog.authorGithub}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-blue-400 transition"
                        >
                          <FiGithub className="text-base" />
                          <span>{blog.authorName || "Anonim"}</span>
                        </a>
                      ) : (
                        <span>{blog.authorName || "Anonim"}</span>
                      )}
                    </div>

                    <Link
                      href={`/blog/${blog.id}`}
                      className="text-blue-400 hover:text-blue-300 font-medium transition"
                    >
                      Selengkapnya →
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-800 text-center py-8 text-gray-500 text-sm mt-auto">
        <p>© {new Date().getFullYear()} TI Gallery — Semua hak dilindungi.</p>
      </footer>
    </main>
  );
}
