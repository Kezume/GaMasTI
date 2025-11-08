"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiGithub, FiCalendar, FiSearch, FiFilter, FiFileText } from "react-icons/fi";

interface Blog {
  id: string;
  title: string;
  content: string;
  images?: string[];
  authorName: string;
  authorAvatar: string;
  githubUrl: string;
  createdAt?: { seconds: number };
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const blogsData = snap.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as Blog[];
        setBlogs(blogsData);
        setFilteredBlogs(blogsData);
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  useEffect(() => {
    const filtered = blogs.filter(blog =>
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.authorName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBlogs(filtered);
  }, [searchTerm, blogs]);

  const formatDate = (seconds: number) => {
    return new Date(seconds * 1000).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Arsip Blog
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Jelajahi semua karya dan artikel dari mahasiswa Teknik Informatika
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-2xl">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari blog berdasarkan judul, konten, atau penulis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-500"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <FiFilter className="text-lg" />
              <span>{filteredBlogs.length} blog ditemukan</span>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-6 animate-pulse">
                <div className="h-48 bg-gray-700 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded mb-2 w-3/4"></div>
                <div className="h-3 bg-gray-700 rounded mb-4 w-1/2"></div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                  <div className="h-3 bg-gray-700 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredBlogs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
              <FiSearch className="text-3xl text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-300 mb-3">
              {searchTerm ? 'Blog Tidak Ditemukan' : 'Belum Ada Blog'}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchTerm 
                ? `Tidak ada hasil untuk "${searchTerm}". Coba dengan kata kunci lain.`
                : 'Jadilah yang pertama membagikan pengetahuan dan karya Anda.'
              }
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredBlogs.map((blog, i) => (
              <motion.article
                key={blog.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2"
              >
                {/* Image */}
                {blog.images && blog.images.length > 0 ? (
                  <Link href={`/blog/${blog.id}`}>
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={blog.images[0]}
                        alt={blog.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                  </Link>
                ) : (
                  <Link href={`/blog/${blog.id}`}>
                    <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10"></div>
                      <div className="text-center z-10">
                        <FiFileText className="text-3xl text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm italic">Tidak ada gambar</p>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Content */}
                <div className="p-6">
                  <Link href={`/blog/${blog.id}`}>
                    <h3 className="font-bold text-lg mb-3 line-clamp-2 group-hover:text-blue-400 transition-colors leading-tight">
                      {blog.title}
                    </h3>
                  </Link>
                  
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {blog.content}
                  </p>

                  {/* Author Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={blog.authorAvatar}
                        alt={blog.authorName}
                        className="w-8 h-8 rounded-full border-2 border-white/20"
                      />
                      <div>
                        <p className="font-medium text-white text-sm">
                          {blog.authorName}
                        </p>
                        {blog.githubUrl && (
                          <a
                            href={blog.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors text-xs"
                          >
                            <FiGithub className="text-xs" />
                            GitHub
                          </a>
                        )}
                      </div>
                    </div>

                    {blog.createdAt && (
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <FiCalendar className="text-xs" />
                        <span>{formatDate(blog.createdAt.seconds)}</span>
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/blog/${blog.id}`}
                    className="w-full mt-4 bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-xl text-center font-medium transition-all group-hover:border-blue-500/30 group-hover:text-blue-400 block"
                  >
                    Baca Selengkapnya
                  </Link>
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </div>
    </main>
  );
}