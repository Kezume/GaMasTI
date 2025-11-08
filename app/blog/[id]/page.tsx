"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion } from "framer-motion";
import Link from "next/link";
import { FiArrowLeft, FiCalendar, FiGithub, FiShare2, FiClock, FiEdit3, FiSave, FiX } from "react-icons/fi";
import DeleteBlogButton from "@/components/DeleteBlogButton";

interface Blog {
  title: string;
  content: string;
  images?: string[];
  authorName?: string;
  authorAvatar?: string;
  authorId?: string;
  authorEmail?: string;
  githubUrl?: string;
  createdAt?: { seconds: number };
}

export default function BlogDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [user, userLoading] = useAuthState(auth);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const docRef = doc(db, "blogs", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const blogData = docSnap.data() as Blog;
          // console.log("=== BLOG DETAIL DEBUG ===");
          // console.log("Blog Data:", blogData);
          // console.log("Blog Author ID:", blogData.authorId);
          // console.log("Blog Author Email:", blogData.authorEmail);
          // console.log("Current User UID:", user?.uid);
          // console.log("Current User Email:", user?.email);
          
          setBlog(blogData);
          setEditTitle(blogData.title);
          setEditContent(blogData.content);
        } else {
          router.push("/404");
        }
      } catch (error) {
        console.error("Error fetching blog:", error);
        router.push("/404");
      } finally {
        setLoading(false);
      }
    };
    
    if (!userLoading) {
      fetchBlog();
    }
  }, [id, router, userLoading]);

  // Fungsi cek ownership yang lebih baik
  const checkOwnership = () => {
    if (!user || !blog) return false;

    // console.log("=== CHECKING OWNERSHIP ===");
    // console.log("User UID:", user.uid);
    // console.log("Blog Author ID:", blog.authorId);
    // console.log("User Email:", user.email);
    // console.log("Blog Author Email:", blog.authorEmail);

    // Cek berdasarkan UID
    if (blog.authorId && user.uid === blog.authorId) {
      console.log("✅ Ownership confirmed by UID");
      return true;
    }

    // Fallback: cek berdasarkan email
    if (blog.authorEmail && user.email && user.email === blog.authorEmail) {
      console.log("✅ Ownership confirmed by Email");
      return true;
    }

    console.log("❌ User is NOT the owner");
    return false;
  };

  const isOwner = checkOwnership();

  const handleUpdate = async () => {
    if (!blog || !isOwner) {
      alert("Anda tidak memiliki izin untuk mengedit blog ini.");
      return;
    }

    if (!editTitle.trim() || !editContent.trim()) {
      alert("Judul dan konten tidak boleh kosong!");
      return;
    }

    setUpdating(true);
    try {
      const blogRef = doc(db, "blogs", id as string);
      await updateDoc(blogRef, {
        title: editTitle.trim(),
        content: editContent.trim(),
        updatedAt: new Date()
      });

      setBlog(prev => prev ? { ...prev, title: editTitle, content: editContent } : null);
      setIsEditing(false);
      alert("Blog berhasil diperbarui!");
    } catch (error) {
      console.error("Error updating blog:", error);
      alert("Gagal memperbarui blog. Silakan coba lagi.");
    } finally {
      setUpdating(false);
    }
  };

  const cancelEdit = () => {
    setEditTitle(blog?.title || "");
    setEditContent(blog?.content || "");
    setIsEditing(false);
  };

  const formatDate = (seconds: number) => {
    return new Date(seconds * 1000).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (seconds: number) => {
    return new Date(seconds * 1000).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} menit membaca`;
  };

  const shareBlog = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog?.title,
          text: blog?.content.substring(0, 100) + '...',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link berhasil disalin ke clipboard!');
    }
  };

  const handleBlogDelete = () => {
    router.push("/");
  };

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Memuat blog...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Blog Tidak Ditemukan</h1>
          <p className="text-gray-400 mb-6">Blog yang Anda cari tidak ada atau telah dihapus.</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
              <FiArrowLeft className="text-lg group-hover:-translate-x-1 transition-transform" />
              <span>Kembali</span>
            </button>
            
            <div className="flex items-center gap-3">
              {/* Edit/Save Button - hanya untuk pemilik */}
              {isOwner && (
                <>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={cancelEdit}
                        disabled={updating}
                        className="flex items-center gap-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30 text-gray-400 hover:text-gray-300 px-4 py-2 rounded-xl transition-all duration-200"
                      >
                        <FiX className="text-sm" />
                        <span>Batal</span>
                      </button>
                      <button
                        onClick={handleUpdate}
                        disabled={updating}
                        className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 hover:text-green-300 px-4 py-2 rounded-xl transition-all duration-200"
                      >
                        {updating ? (
                          <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                        ) : (
                          <FiSave className="text-sm" />
                        )}
                        <span>{updating ? 'Menyimpan...' : 'Simpan'}</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 hover:text-blue-300 px-4 py-2 rounded-xl transition-all duration-200"
                    >
                      <FiEdit3 className="text-sm" />
                      <span>Edit</span>
                    </button>
                  )}
                </>
              )}
              
              {/* Delete Button - hanya untuk pemilik */}
              {isOwner && blog.authorId && (
                <DeleteBlogButton 
                  blogId={id as string}
                  authorId={blog.authorId}
                  authorEmail={blog.authorEmail}
                  blogTitle={blog.title}
                  onDelete={handleBlogDelete}
                />
              )}
              
              <button
                onClick={shareBlog}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-xl transition-all"
              >
                <FiShare2 className="text-sm" />
                <span>Bagikan</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Konten artikel tetap sama */}
      <div className="max-w-4xl mx-auto px-6 pt-24 pb-16">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-8 border-b border-white/10">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-black/30 border border-blue-500/50 rounded-xl px-4 py-3 text-2xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Judul blog..."
                />
                <div className="text-right text-sm text-gray-500">
                  {editTitle.length}/100 karakter
                </div>
              </div>
            ) : (
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl sm:text-4xl font-bold mb-6 leading-tight"
              >
                {blog.title}
              </motion.h1>
            )}

            {/* Author & Meta Info */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={blog.authorAvatar || "/default-avatar.png"}
                  alt={blog.authorName}
                  className="w-12 h-12 rounded-full border-2 border-white/20"
                />
                <div>
                  <p className="font-semibold text-lg">{blog.authorName || "Anonim"}</p>
                  {blog.githubUrl && (
                    <a
                      href={blog.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                    >
                      <FiGithub className="text-sm" />
                      {blog.githubUrl.split('/').pop()}
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-400">
                {blog.createdAt && (
                  <>
                    <div className="flex items-center gap-1">
                      <FiCalendar className="text-sm" />
                      <span>{formatDate(blog.createdAt.seconds)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiClock className="text-sm" />
                      <span>{formatTime(blog.createdAt.seconds)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>•</span>
                      <span>{estimateReadTime(blog.content)}</span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>

          {/* Content */}
          <div className="p-8">
            {isEditing ? (
              <div className="space-y-4">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={15}
                  className="w-full bg-black/30 border border-blue-500/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  placeholder="Tulis konten blog Anda di sini..."
                />
                <div className="text-right text-sm text-gray-500">
                  {editContent.length}/5000 karakter
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="prose prose-invert max-w-none prose-lg"
              >
                <div className="whitespace-pre-line leading-relaxed text-gray-300 text-lg">
                  {blog.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-6">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Images Gallery */}
            {blog.images && blog.images.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-12"
              >
                <h3 className="text-2xl font-bold mb-6">Galeri Gambar</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {blog.images.map((img, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      className="relative group cursor-pointer rounded-2xl overflow-hidden border border-white/10 bg-black/20"
                      onClick={() => setSelectedImage(img)}
                    >
                      <img
                        src={img}
                        alt={`image-${i}`}
                        className="w-full h-64 object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-white text-sm bg-black/70 px-3 py-2 rounded-lg">
                          Klik untuk memperbesar
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Owner Badge */}
          {isOwner && (
            <div className="px-8 pb-6">
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                <p className="text-blue-400 text-sm text-center">
                  🛠️ Anda adalah pemilik blog ini. Anda dapat mengedit atau menghapus blog ini.
                </p>
              </div>
            </div>
          )}
        </motion.article>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full transition-colors"
            >
              <FiX className="text-xl" />
            </button>
          </div>
        </motion.div>
      )}
    </main>
  );
}