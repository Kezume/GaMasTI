// app/blog/page.tsx - VERSI RESPONSIF
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
  FiEye,
  FiYoutube,
  FiImage,
} from "react-icons/fi";

// Interface Blog
interface Blog {
  id: string;
  title: string;
  content: string;
  images?: string[];
  youtubeUrls?: string[];
  authorName: string;
  authorAvatar: string;
  authorId?: string;
  githubUrl?: string;
  createdAt?: { seconds: number };
  status?: string;
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, userLoading] = useAuthState(auth);

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
            youtubeUrls: data.youtubeUrls || [],
            authorName: data.authorName || "Anonim",
            authorAvatar: data.authorAvatar || "/default-avatar.png",
            authorId: data.authorId || "",
            githubUrl: data.githubUrl || "",
            status: data.status || "published",
            createdAt: data.createdAt,
          };
        }) as Blog[];

        const publishedBlogs = blogsData.filter(
          (blog) => blog.status === "published" || !blog.status
        );

        setBlogs(publishedBlogs);
        setFilteredBlogs(publishedBlogs);
      } catch (error) {
        console.error("Error fetching blogs:", error);
        setError("Gagal memuat blog. Silakan refresh halaman.");

        try {
          const snapshot = await getDocs(collection(db, "blogs"));
          const allBlogs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Blog[];

          const publishedBlogs = allBlogs
            .filter((blog) => blog.status === "published" || !blog.status)
            .sort((a, b) => {
              const dateA = a.createdAt?.seconds || 0;
              const dateB = b.createdAt?.seconds || 0;
              return dateB - dateA;
            });

          setBlogs(publishedBlogs);
          setFilteredBlogs(publishedBlogs);
        } catch (fallbackError) {
          console.error("Fallback error:", fallbackError);
        }
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
        <div className="max-w-7xl mx-auto text-center py-12 sm:py-20">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-red-500/30">
            <FiBook className="text-2xl sm:text-3xl text-red-400" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
            Terjadi Kesalahan
          </h1>
          <p className="text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all shadow-lg text-sm sm:text-base"
          >
            Refresh Halaman
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header - Responsif */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12 md:mb-16 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 blur-3xl rounded-full transform scale-150"></div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 relative">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent animate-gradient">
              Blog Space
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-2">
            Jelajahi dunia pengetahuan dan inspirasi dari mahasiswa Teknik
            Informatika.
            <span className="block text-cyan-400 font-medium mt-1 sm:mt-2 text-sm sm:text-base">
              Temukan, Pelajari, dan Berbagi!
            </span>
          </p>

          {/* Quick Actions - Responsif */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8"
          >
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-3 bg-white/10 hover:bg-white/20 border border-white/20 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-medium backdrop-blur-sm transition-all hover:scale-105 group relative z-10 text-sm sm:text-base"
            >
              <FiHome className="text-base sm:text-lg group-hover:text-cyan-400 transition-colors" />
              <span>Beranda</span>
            </Link>

            {!userLoading && user && (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-medium transition-all hover:scale-105 shadow-lg hover:shadow-green-500/25 relative z-10 active:scale-95 text-sm sm:text-base"
              >
                <FiPlus className="text-base sm:text-lg" />
                <span>Buat Blog Baru</span>
              </Link>
            )}

            {!userLoading && !user && (
              <Link
                href="/auth/login"
                className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-medium transition-all hover:scale-105 shadow-lg hover:shadow-amber-500/25 relative z-10 text-sm sm:text-base"
              >
                <FiPlus className="text-base sm:text-lg" />
                <span>Login untuk Buat Blog</span>
              </Link>
            )}
          </motion.div>
        </motion.div>

        {/* Enhanced Search Section - Responsif */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 sm:mb-12"
        >
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-center justify-between">
              <div className="flex-1 w-full">
                <div className="relative">
                  <FiSearch className="absolute left-3 sm:left-5 top-1/2 transform -translate-y-1/2 text-cyan-400 text-lg sm:text-xl" />
                  <input
                    type="text"
                    placeholder="Cari blog berdasarkan judul, konten, atau penulis..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/30 border border-cyan-500/30 rounded-xl sm:rounded-2xl pl-10 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 text-base sm:text-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all placeholder-gray-400 backdrop-blur-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto justify-between lg:justify-normal">
                <div className="flex items-center gap-2 sm:gap-3 bg-black/30 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-cyan-500/20">
                  <FiFilter className="text-cyan-400 text-base sm:text-lg" />
                  <span className="text-gray-300 font-medium text-sm sm:text-base">
                    {filteredBlogs.length} Blog
                  </span>
                </div>

                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-cyan-400 hover:text-cyan-300 underline transition-colors text-sm sm:text-base whitespace-nowrap"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 animate-pulse"
              >
                <div className="h-32 sm:h-40 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg sm:rounded-xl mb-3 sm:mb-4"></div>
                <div className="h-4 sm:h-5 bg-gray-700 rounded mb-2 sm:mb-3"></div>
                <div className="h-3 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded mb-3 sm:mb-4 w-3/4"></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-700 rounded-full"></div>
                    <div className="space-y-1">
                      <div className="h-3 bg-gray-700 rounded w-14 sm:w-16"></div>
                      <div className="h-2 bg-gray-700 rounded w-10 sm:w-12"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-700 rounded w-12 sm:w-14"></div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : filteredBlogs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 sm:py-16 md:py-20 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl sm:rounded-3xl"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-cyan-500/30">
              <FiSearch className="text-2xl sm:text-3xl md:text-4xl text-cyan-400" />
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-200 mb-3 sm:mb-4">
              {searchTerm ? "Tidak Ada Hasil" : "Belum Ada Blog"}
            </h3>
            <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-md mx-auto mb-6 sm:mb-8 leading-relaxed px-4">
              {searchTerm
                ? `Maaf, tidak ada blog yang cocok dengan "${searchTerm}". Coba kata kunci lain atau lihat semua blog.`
                : "Jadilah yang pertama membagikan pengetahuan dan inspirasi kepada komunitas!"}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              {!userLoading && user && !searchTerm && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-5 sm:px-6 md:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all shadow-lg hover:shadow-green-500/25 relative z-10 text-sm sm:text-base"
                >
                  <FiPlus className="text-lg sm:text-xl" />
                  <span>Buat Blog Pertama</span>
                </Link>
              )}
              {!userLoading && !user && !searchTerm && (
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-5 sm:px-6 md:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all shadow-lg hover:shadow-amber-500/25 text-sm sm:text-base"
                >
                  <FiPlus className="text-lg sm:text-xl" />
                  <span>Login untuk Mulai Menulis</span>
                </Link>
              )}
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="inline-flex items-center gap-2 sm:gap-3 bg-white/10 hover:bg-white/20 border border-white/20 px-5 sm:px-6 md:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all text-sm sm:text-base"
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {filteredBlogs.map((blog, i) => (
              <motion.article
                key={blog.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: i * 0.1,
                  type: "spring",
                  stiffness: 100,
                }}
                whileHover={{
                  y: -4,
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }}
                className="group bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-lg border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl hover:shadow-cyan-500/15 transition-all duration-300 relative"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Image - Responsif */}
                {blog.images && blog.images.length > 0 ? (
                  <Link
                    href={`/blog/${blog.id}`}
                    className="block relative h-32 sm:h-40 overflow-hidden"
                  >
                    <img
                      src={blog.images[0]}
                      alt={blog.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* YouTube Badge */}
                    {blog.youtubeUrls && blog.youtubeUrls.length > 0 && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white px-1.5 py-1 rounded-full text-xs flex items-center gap-1 backdrop-blur-sm">
                        <FiYoutube className="text-xs" />
                        <span className="text-xs">
                          {blog.youtubeUrls.length}
                        </span>
                      </div>
                    )}

                    <div className="absolute top-2 right-2">
                      <span className="bg-cyan-500/90 text-white px-1.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                        <FiEye className="inline mr-1 text-xs" />
                        Baca
                      </span>
                    </div>
                  </Link>
                ) : (
                  <Link
                    href={`/blog/${blog.id}`}
                    className="block h-32 sm:h-40 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 group-hover:from-cyan-500/20 group-hover:to-blue-500/20 transition-all duration-300"></div>

                    {blog.youtubeUrls && blog.youtubeUrls.length > 0 && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white px-1.5 py-1 rounded-full text-xs flex items-center gap-1 z-20 backdrop-blur-sm">
                        <FiYoutube className="text-xs" />
                        <span className="text-xs">
                          {blog.youtubeUrls.length}
                        </span>
                      </div>
                    )}

                    <div className="text-center z-10">
                      <FiBook className="text-xl sm:text-2xl text-cyan-400 mx-auto mb-1 sm:mb-2 group-hover:scale-110 transition-transform duration-300" />
                      <p className="text-cyan-300 text-xs font-medium italic">
                        Jelajahi Konten
                      </p>
                    </div>
                  </Link>
                )}

                {/* Content - Responsif */}
                <div className="p-4 sm:p-5 relative z-10">
                  <Link href={`/blog/${blog.id}`}>
                    <h3 className="font-bold text-base sm:text-lg mb-2 line-clamp-2 group-hover:text-cyan-400 transition-colors duration-200 leading-tight">
                      {blog.title}
                    </h3>
                  </Link>

                  <p className="text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
                    {blog.content}
                  </p>

                  {/* Author Info - Responsif */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={blog.authorAvatar}
                        alt={blog.authorName}
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-cyan-500/30 group-hover:border-cyan-500 transition-colors duration-200"
                      />
                      <div>
                        <p className="font-semibold text-white text-xs">
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
                            <span className="text-xs hidden xs:inline">
                              GitHub
                            </span>
                          </a>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-500 text-xs">
                            <FiUser className="text-xs" />
                            <span className="text-xs hidden xs:inline">
                              Anonim
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {blog.createdAt && (
                      <div className="flex items-center gap-1 text-cyan-400 text-xs bg-cyan-500/10 px-2 py-1 rounded-full border border-cyan-500/20">
                        <FiCalendar className="text-xs" />
                        <span className="text-xs hidden xs:inline">
                          {formatDate(blog.createdAt.seconds)}
                        </span>
                        <span className="text-xs xs:hidden">
                          {new Date(
                            blog.createdAt.seconds * 1000
                          ).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons - Responsif */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <Link
                      href={`/blog/${blog.id}`}
                      className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium text-xs transition-all group/read"
                    >
                      <span>Baca Lengkap</span>
                      <FiEye className="group-hover/read:translate-x-0.5 transition-transform duration-200 text-xs" />
                    </Link>

                    {/* Action Buttons untuk pemilik */}
                    {blog.authorId && user && user.uid === blog.authorId && (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/blog/edit/${blog.id}`}
                          className="text-green-400 hover:text-green-300 text-xs transition-colors"
                        >
                          Edit
                        </Link>
                        <span className="text-gray-600 text-xs">•</span>
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

        {/* Enhanced Back to Home - Responsif */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-8 sm:mt-12 md:mt-16"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-5 sm:px-6 md:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all shadow-lg hover:shadow-purple-500/25 hover:scale-105 relative z-10 text-sm sm:text-base"
          >
            <FiHome className="text-lg sm:text-xl" />
            <span>Kembali ke Menu Utama</span>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
