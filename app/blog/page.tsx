// app/blog/page.tsx
"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import Link from "next/link";
import { motion } from "framer-motion";
import DeleteBlogButton from "@/components/DeleteBlogButton";
import {
  FiGithub,
  FiCalendar,
  FiSearch,
  FiFilter,
  FiBook,
  FiUser,
  FiHome,
  FiPlus,
  FiEye
} from "react-icons/fi";

interface Blog {
  id: string;
  title: string;
  content: string;
  images?: string[];
  authorName: string;
  authorAvatar: string;
  authorId?: string;
  githubUrl?: string;
  createdAt?: { seconds: number };
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user] = useAuthState(auth);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setError(null);
        const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);

        if (snap.empty) {
          setBlogs([]);
          setFilteredBlogs([]);
          return;
        }

        const blogsData = snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || "Judul Tidak Tersedia",
            content: data.content || "Konten tidak tersedia",
            images: data.images || [],
            authorName: data.authorName || "Anonim",
            authorAvatar: data.authorAvatar || "/default-avatar.png",
            authorId: data.authorId || "",
            githubUrl: data.githubUrl || "",
            createdAt: data.createdAt,
          };
        }) as Blog[];

        setBlogs(blogsData);
        setFilteredBlogs(blogsData);
      } catch (error) {
        console.error("Error fetching blogs:", error);
        setError("Gagal memuat blog. Silakan refresh halaman.");
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBlogs(blogs);
      return;
    }

    const filtered = blogs.filter(
      (blog) =>
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.authorName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBlogs(filtered);
  }, [searchTerm, blogs]);

  const formatDate = (seconds: number) => {
    if (!seconds) return "Tanggal tidak tersedia";

    return new Date(seconds * 1000).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-4 py-8">
        <div className="max-w-7xl mx-auto text-center py-20">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
            <FiBook className="text-3xl text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Terjadi Kesalahan
          </h1>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-6 py-3 rounded-xl font-medium transition-all shadow-lg"
          >
            Refresh Halaman
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 blur-3xl rounded-full transform scale-150"></div>
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 relative">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent animate-gradient">
              Blog Space
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Jelajahi dunia pengetahuan dan inspirasi dari mahasiswa Teknik Informatika. 
            <span className="block text-cyan-400 font-medium mt-2">
              Temukan, Pelajari, dan Berbagi!
            </span>
          </p>
          
          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 mt-8"
          >
            <Link
              href="/"
              className="flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 rounded-2xl font-medium backdrop-blur-sm transition-all hover:scale-105 group"
            >
              <FiHome className="text-lg group-hover:text-cyan-400 transition-colors" />
              <span>Beranda</span>
            </Link>
            
            {user && (
              <Link
                href="/blog/create"
                className="flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-6 py-3 rounded-2xl font-medium transition-all hover:scale-105 shadow-lg hover:shadow-green-500/25"
              >
                <FiPlus className="text-lg" />
                <span>Buat Blog Baru</span>
              </Link>
            )}
          </motion.div>
        </motion.div>

        {/* Enhanced Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              <div className="flex-1 w-full">
                <div className="relative">
                  <FiSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-cyan-400 text-xl" />
                  <input
                    type="text"
                    placeholder="Cari blog berdasarkan judul, konten, atau penulis..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/30 border border-cyan-500/30 rounded-2xl pl-14 pr-6 py-4 text-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all placeholder-gray-400 backdrop-blur-sm"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-black/30 px-4 py-3 rounded-2xl border border-cyan-500/20">
                  <FiFilter className="text-cyan-400 text-lg" />
                  <span className="text-gray-300 font-medium">
                    {filteredBlogs.length} Blog Ditemukan
                  </span>
                </div>
                
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-6 animate-pulse"
              >
                <div className="h-48 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl mb-4"></div>
                <div className="h-6 bg-gray-700 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-700 rounded-lg mb-2"></div>
                <div className="h-4 bg-gray-700 rounded-lg mb-4 w-3/4"></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-700 rounded w-20"></div>
                      <div className="h-2 bg-gray-700 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-700 rounded w-16"></div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : filteredBlogs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl"
          >
            <div className="w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-cyan-500/30">
              <FiSearch className="text-4xl text-cyan-400" />
            </div>
            <h3 className="text-3xl font-bold text-gray-200 mb-4">
              {searchTerm ? "Tidak Ada Hasil" : "Belum Ada Blog"}
            </h3>
            <p className="text-gray-400 text-lg max-w-md mx-auto mb-8 leading-relaxed">
              {searchTerm
                ? `Maaf, tidak ada blog yang cocok dengan "${searchTerm}". Coba kata kunci lain atau lihat semua blog.`
                : "Jadilah yang pertama membagikan pengetahuan dan inspirasi kepada komunitas!"}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user && !searchTerm && (
                <Link
                  href="/blog/create"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-8 py-4 rounded-2xl font-semibold transition-all shadow-lg hover:shadow-green-500/25"
                >
                  <FiPlus className="text-xl" />
                  Buat Blog Pertama
                </Link>
              )}
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="inline-flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 px-8 py-4 rounded-2xl font-semibold transition-all"
                >
                  Tampilkan Semua Blog
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
          >
            {filteredBlogs.map((blog, i) => (
              <motion.article
                key={blog.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: i * 0.1,
                  type: "spring",
                  stiffness: 100 
                }}
                whileHover={{ 
                  y: -8,
                  transition: { duration: 0.3 }
                }}
                className="group bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-lg border border-white/10 rounded-3xl overflow-hidden shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500 relative"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Image */}
                {blog.images && blog.images.length > 0 ? (
                  <Link href={`/blog/${blog.id}`}>
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={blog.images[0]}
                        alt={blog.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute top-4 right-4">
                        <span className="bg-cyan-500/90 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                          <FiEye className="inline mr-1" />
                          Baca
                        </span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <Link href={`/blog/${blog.id}`}>
                    <div className="h-52 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-all duration-500"></div>
                      <div className="text-center z-10">
                        <FiBook className="text-4xl text-cyan-400 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
                        <p className="text-cyan-300 text-sm font-medium italic">
                          Jelajahi Konten Spesial
                        </p>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Content */}
                <div className="p-6 relative z-10">
                  <Link href={`/blog/${blog.id}`}>
                    <h3 className="font-bold text-xl mb-3 line-clamp-2 group-hover:text-cyan-400 transition-colors duration-300 leading-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      {blog.title}
                    </h3>
                  </Link>
                  
                  <p className="text-gray-300 text-sm mb-6 line-clamp-3 leading-relaxed">
                    {blog.content}
                  </p>

                  {/* Author Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={blog.authorAvatar}
                        alt={blog.authorName}
                        className="w-10 h-10 rounded-full border-2 border-cyan-500/30 group-hover:border-cyan-500 transition-colors duration-300"
                      />
                      <div>
                        <p className="font-semibold text-white text-sm">
                          {blog.authorName}
                        </p>
                        {blog.githubUrl ? (
                          <a
                            href={blog.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors text-xs"
                          >
                            <FiGithub className="text-xs" />
                            GitHub
                          </a>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-500 text-xs">
                            <FiUser className="text-xs" />
                            <span>Anonim</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {blog.createdAt && (
                      <div className="flex items-center gap-2 text-cyan-400 text-xs bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                        <FiCalendar className="text-xs" />
                        <span>{formatDate(blog.createdAt.seconds)}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <Link
                      href={`/blog/${blog.id}`}
                      className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold text-sm transition-all group/read"
                    >
                      <span>Baca Lengkap</span>
                      <FiEye className="group-hover/read:translate-x-1 transition-transform duration-300" />
                    </Link>

                    {/* Action Buttons untuk pemilik */}
                    {blog.authorId && user && user.uid === blog.authorId && (
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/blog/edit/${blog.id}`}
                          className="text-green-400 hover:text-green-300 text-sm transition-colors"
                        >
                          Edit
                        </Link>
                        <span className="text-gray-600">•</span>
                        <DeleteBlogButton
                          blogId={blog.id}
                          authorId={blog.authorId}
                          blogTitle={blog.title}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}

        {/* Enhanced Back to Home */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-16"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-8 py-4 rounded-2xl font-semibold transition-all shadow-lg hover:shadow-purple-500/25 hover:scale-105"
          >
            <FiHome className="text-xl" />
            <span>Kembali ke Menu Utama</span>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}