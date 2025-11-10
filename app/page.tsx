// app/page.tsx - UPDATE DENGAN YOUTUBE
"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import Link from "next/link";
import { motion } from "framer-motion";
import AuthButton from "@/components/AuthButton";
import {
  FiPlusCircle,
  FiGithub,
  FiCalendar,
  FiEye,
  FiTrendingUp,
  FiBook,
  FiSettings,
  FiYoutube,
  FiImage,
} from "react-icons/fi";

interface Blog {
  id: string;
  title: string;
  content: string;
  images?: string[];
  youtubeUrls?: string[]; // TAMBAHKAN INI
  authorName?: string;
  authorAvatar?: string;
  authorId?: string;
  githubUrl?: string;
  createdAt?: { seconds: number };
  status?: string;
}

export default function HomePage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        try {
          const userDoc = await getDocs(collection(db, "users"));
          const userData = userDoc.docs.find((doc) => doc.id === user.uid);
          if (userData?.data()?.role === "admin") {
            setIsAdmin(true);
          }
        } catch (error) {
          console.error("Error checking admin:", error);
        }
      }
    };

    checkAdmin();
  }, [user]);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        console.log("Fetching blogs...");

        // Query sederhana tanpa where clause untuk menghindari index error
        const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const allBlogs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Blog[];

        console.log("All blogs fetched:", allBlogs.length);
        console.log("Blogs data:", allBlogs);

        // Filter manual di client side untuk published blogs
        const publishedBlogs = allBlogs.filter((blog) => {
          // Include blogs with status 'published' or no status (legacy blogs)
          const isPublished = blog.status === "published" || !blog.status;
          console.log(
            `Blog: ${blog.title}, Status: ${blog.status}, Published: ${isPublished}`
          );
          return isPublished;
        });

        console.log("Published blogs:", publishedBlogs.length);
        setBlogs(publishedBlogs);
      } catch (error) {
        console.error("Error fetching blogs:", error);

        // Fallback: try without orderBy if still error
        try {
          console.log("Trying fallback query...");
          const snapshot = await getDocs(collection(db, "blogs"));
          const allBlogs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Blog[];

          const publishedBlogs = allBlogs
            .filter((blog) => blog.status === "published" || !blog.status)
            .sort((a, b) => {
              // Manual sort by date
              const dateA = a.createdAt?.seconds || 0;
              const dateB = b.createdAt?.seconds || 0;
              return dateB - dateA;
            });

          setBlogs(publishedBlogs);
        } catch (fallbackError) {
          console.error("Fallback error:", fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const formatDate = (seconds: number) => {
    if (!seconds) return "Tanggal tidak tersedia";
    return new Date(seconds * 1000).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Hanya ambil 3 blog terbaru untuk ditampilkan di home
  const featuredBlogs = blogs.slice(0, 3);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex flex-col">
      {/* NAVBAR DENGAN MENU BLOGS & ADMIN */}
      <header className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
              <span className="font-bold text-white text-lg">TI</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight group-hover:text-blue-400 transition-colors">
                GAMASTI
              </h1>
              <p className="text-xs text-gray-400">By HMPTI</p>
            </div>
          </Link>

          {/* NAVIGATION MENU */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-white font-medium hover:text-blue-400 transition-colors"
            >
              Beranda
            </Link>
            <Link
              href="/blog"
              className="flex items-center gap-2 text-gray-300 hover:text-blue-400 transition-colors group"
            >
              <FiBook className="text-lg group-hover:scale-110 transition-transform" />
              <span>Semua Blog</span>
            </Link>

            {/* ADMIN LINK - Hanya tampil untuk admin */}
            {user && isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 hover:text-purple-300 px-4 py-2 rounded-xl transition-all"
              >
                <FiSettings className="text-lg" />
                <span>Admin</span>
              </Link>
            )}

            {user && (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 px-4 py-2 rounded-xl font-medium shadow-lg hover:shadow-blue-500/25 transition-all"
              >
                <FiPlusCircle className="text-lg" />
                <span>Tulis Blog</span>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2">
              {/* Admin Button Mobile */}
              {user && isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 hover:text-purple-300 p-2 rounded-xl transition-all"
                >
                  <FiSettings className="text-lg" />
                </Link>
              )}
              {user && (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 p-2 rounded-xl font-medium text-sm"
                >
                  <FiPlusCircle className="text-lg" />
                </Link>
              )}
            </div>
            <AuthButton />
          </div>
        </div>

        {/* MOBILE NAVIGATION */}
        <div className="md:hidden border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-around">
            <Link
              href="/"
              className="flex flex-col items-center gap-1 text-white text-xs"
            >
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <span className="text-sm">🏠</span>
              </div>
              <span>Beranda</span>
            </Link>
            <Link
              href="/blog"
              className="flex flex-col items-center gap-1 text-gray-300 hover:text-blue-400 transition-colors text-xs"
            >
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <FiBook className="text-sm" />
              </div>
              <span>Blog</span>
            </Link>
            {/* Admin Mobile */}
            {user && isAdmin && (
              <Link
                href="/admin"
                className="flex flex-col items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors text-xs"
              >
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <FiSettings className="text-sm" />
                </div>
                <span>Admin</span>
              </Link>
            )}
            {user && (
              <Link
                href="/dashboard"
                className="flex flex-col items-center gap-1 text-gray-300 hover:text-blue-400 transition-colors text-xs"
              >
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <FiPlusCircle className="text-sm" />
                </div>
                <span>Tulis</span>
              </Link>
            )}
          </div>
        </div>
      </header>
      {/* HERO SECTION */}
      <section className="relative flex flex-col items-center justify-center text-center mt-32 px-6 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <h1 className="text-5xl sm:text-7xl font-extrabold mb-6">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
              GAMASTI
            </span>
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed"
          >
            Platform kolaborasi mahasiswa Teknik Informatika untuk berbagi
            karya, inovasi, dan pengetahuan dalam dunia teknologi
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link
              href="#blogs"
              className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              Jelajahi Karya
            </Link>
            <Link
              href="/blog"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-4 rounded-xl font-medium backdrop-blur-sm transition-all"
            >
              <FiBook className="text-lg" />
              Lihat Semua Blog
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="relative z-10 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
        >
          {[
            { icon: FiTrendingUp, label: "Blog Aktif", value: blogs.length },
            { icon: FiEye, label: "Pengunjung", value: "1" },
            { icon: FiCalendar, label: "Tahun Aktif", value: "2025" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3 border border-white/10">
                <stat.icon className="text-2xl text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>
      {/* BLOG LIST SECTION - HANYA 3 BLOG */}
      <section id="blogs" className="max-w-7xl mx-auto mt-20 px-6 pb-24 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center justify-between mb-12"
        >
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              ✨ Karya Terbaru
            </h2>
            <p className="text-gray-400">
              3 blog terbaru dari mahasiswa Teknik Informatika
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/blog"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-3 rounded-xl font-medium backdrop-blur-sm transition-all"
            >
              <FiBook className="text-lg" />
              Lihat Semua
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 px-5 py-3 rounded-xl font-medium shadow-lg hover:shadow-blue-500/25 transition-all"
              >
                <FiPlusCircle className="text-lg" />
                Tambah Blog
              </Link>
            )}
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-5 animate-pulse">
                <div className="h-40 bg-gray-700 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-700 rounded mb-3"></div>
                <div className="h-4 bg-gray-700 rounded mb-2 w-3/4"></div>
                <div className="h-3 bg-gray-700 rounded mb-4 w-1/2"></div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                  <div className="h-3 bg-gray-700 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : featuredBlogs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
              <FiBook className="text-2xl text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-3">
              Belum Ada Blog
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              {user
                ? "Mulai buat blog pertama Anda!"
                : "Belum ada blog yang dipublikasikan."}
            </p>
            {user && (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 px-5 py-2.5 rounded-xl font-medium transition-colors"
              >
                <FiPlusCircle />
                Buat Blog Pertama
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBlogs.map((blog, i) => (
              <motion.article
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1"
              >
                {/* IMAGE */}
                {blog.images && blog.images.length > 0 ? (
                  <Link href={`/blog/${blog.id}`}>
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={blog.images[0]}
                        alt={blog.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                      {/* YouTube Badge */}
                      {blog.youtubeUrls && blog.youtubeUrls.length > 0 && (
                        <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                          <FiYoutube className="text-xs" />
                          <span>{blog.youtubeUrls.length}</span>
                        </div>
                      )}

                      <div className="absolute top-3 right-3">
                        <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full border border-white/20">
                          {blog.images.length} foto
                        </div>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <Link href={`/blog/${blog.id}`}>
                    <div className="h-40 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10"></div>

                      {/* YouTube Badge */}
                      {blog.youtubeUrls && blog.youtubeUrls.length > 0 && (
                        <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 z-20">
                          <FiYoutube className="text-xs" />
                          <span>{blog.youtubeUrls.length}</span>
                        </div>
                      )}

                      <div className="text-center z-10">
                        <FiBook className="text-3xl text-gray-600 mx-auto mb-1" />
                        <p className="text-gray-500 text-xs italic">
                          Tidak ada gambar
                        </p>
                      </div>
                    </div>
                  </Link>
                )}

                {/* CONTENT */}
                <div className="p-5">
                  <div className="mb-4">
                    <Link href={`/blog/${blog.id}`}>
                      <h3 className="font-bold text-base mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors leading-tight">
                        {blog.title}
                      </h3>
                    </Link>
                    <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed mb-3">
                      {blog.content}
                    </p>
                  </div>

                  {/* AUTHOR + META */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={blog.authorAvatar || "/default-avatar.png"}
                        alt={blog.authorName}
                        className="w-6 h-6 rounded-full border border-white/20"
                      />
                      <span className="text-xs text-gray-300 font-medium">
                        {blog.authorName || "Anonim"}
                      </span>
                    </div>

                    {blog.createdAt && (
                      <div className="text-xs text-gray-500">
                        {formatDate(blog.createdAt.seconds)}
                      </div>
                    )}
                  </div>

                  {/* Read More Button */}
                  <Link
                    href={`/blog/${blog.id}`}
                    className="mt-4 w-full bg-white/5 hover:bg-white/10 border border-white/10 py-2 rounded-lg text-center text-sm font-medium transition-all group-hover:border-blue-500/30 group-hover:text-blue-400 block"
                  >
                    Baca Selengkapnya
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {/* View All Blogs Button - Selalu tampilkan jika ada blog */}
        {blogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-105"
            >
              <FiBook className="text-lg" />
              Lihat Semua Blog ({blogs.length})
            </Link>
          </motion.div>
        )}
      </section>
      {/* FEATURES SECTION */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            🚀 Mengapa Bergabung?
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Platform ini dirancang khusus untuk mendukung perkembangan mahasiswa
            Teknik Informatika
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: "💡",
              title: "Bagikan Pengetahuan",
              description:
                "Bagikan pengalaman, tutorial, dan insight teknologi terbaru dengan komunitas",
            },
            {
              icon: "👥",
              title: "Bangun Jaringan",
              description:
                "Terhubung dengan mahasiswa TI dari berbagai angkatan dan latar belakang",
            },
            {
              icon: "🚀",
              title: "Tingkatkan Skill",
              description:
                "Dapatkan feedback dan inspirasi untuk mengembangkan kemampuan teknis Anda",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black/50 backdrop-blur-xl py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                  <span className="font-bold text-white text-lg">TI</span>
                </div>
                <span className="text-xl font-bold">GAMASTI</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Platform kolaborasi dan berbagi pengetahuan untuk mahasiswa
                Teknik Informatika. Tempat untuk menunjukkan karya, berbagi
                ilmu, dan menginspirasi sesama.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Navigasi</h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/"
                    className="text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    Beranda
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    Semua Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    Tulis Blog
                  </Link>
                </li>
                {user && isAdmin && (
                  <li>
                    <Link
                      href="/admin"
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Admin Dashboard
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            {/* Stats */}
            <div>
              <h4 className="font-semibold text-white mb-4">Statistik</h4>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center gap-2">
                  <FiBook className="text-blue-400" />
                  <span>{blogs.length} Blog Publik</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiEye className="text-green-400" />
                  <span>1 Pengunjung</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCalendar className="text-purple-400" />
                  <span>Aktif 2025</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} GAMASTI — Semua hak dilindungi.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
