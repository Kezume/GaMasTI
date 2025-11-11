"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, getDocs, collection } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiGithub, 
  FiShare2, 
  FiClock, 
  FiEdit3, 
  FiSave, 
  FiX, 
  FiSettings,
  FiYoutube,
  FiPlay,
  FiImage,
  FiPlus,
  FiCheck,
  FiEdit2,
  FiTrash2
} from "react-icons/fi";
import DeleteBlogButton from "@/components/DeleteBlogButton";
import YouTubeEmbed from "@/components/YoutubeEmbed";
import { toast } from "react-toastify";

interface Blog {
  title: string;
  content: string;
  images?: string[];
  youtubeUrls?: string[]; // TAMBAHKAN INI
  authorName?: string;
  authorAvatar?: string;
  authorId?: string;
  authorEmail?: string;
  githubUrl?: string;
  status?: string;
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
  const [isAdmin, setIsAdmin] = useState(false);

  // State untuk edit YouTube URLs
  const [editYoutubeUrls, setEditYoutubeUrls] = useState<string[]>([]);
  const [youtubeInput, setYoutubeInput] = useState("");
  const [editingYoutubeIndex, setEditingYoutubeIndex] = useState<number | null>(null);
  const [editYoutubeInput, setEditYoutubeInput] = useState("");

  // State untuk edit Images
  const [editImages, setEditImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        try {
          const userDoc = await getDocs(collection(db, "users"));
          const userData = userDoc.docs.find(doc => doc.id === user.uid);
          if (userData?.data()?.role === 'admin') {
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
    const fetchBlog = async () => {
      try {
        const docRef = doc(db, "blogs", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const blogData = docSnap.data() as Blog;
          setBlog(blogData);
          setEditTitle(blogData.title);
          setEditContent(blogData.content);
          setEditYoutubeUrls(blogData.youtubeUrls || []);
          setEditImages(blogData.images || []);
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

  // Fungsi cek ownership - owner atau admin bisa edit/hapus
  const isOwner = user && blog && (user.uid === blog.authorId || isAdmin);

  // Helper functions untuk YouTube
  const extractYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const isValidYouTubeUrl = (url: string): boolean => {
    return extractYouTubeId(url) !== null;
  };

  // Fungsi untuk YouTube URLs
  const addYouTubeUrl = () => {
    const trimmedUrl = youtubeInput.trim();

    if (!trimmedUrl) {
      toast.error("URL YouTube tidak boleh kosong");
      return;
    }

    if (!isValidYouTubeUrl(trimmedUrl)) {
      toast.error("URL YouTube tidak valid");
      return;
    }

    if (editYoutubeUrls.includes(trimmedUrl)) {
      toast.warning("URL YouTube ini sudah ditambahkan");
      return;
    }

    if (editYoutubeUrls.length >= 3) {
      toast.warning("Maksimal 3 video YouTube");
      return;
    }

    setEditYoutubeUrls([...editYoutubeUrls, trimmedUrl]);
    setYoutubeInput("");
    toast.success("Video YouTube berhasil ditambahkan!");
  };

  const removeYouTubeUrl = (index: number) => {
    setEditYoutubeUrls(editYoutubeUrls.filter((_, i) => i !== index));
    toast.success("Video YouTube dihapus");
  };

  const startEditYouTubeUrl = (index: number) => {
    setEditingYoutubeIndex(index);
    setEditYoutubeInput(editYoutubeUrls[index]);
  };

  const saveEditYouTubeUrl = () => {
    if (editingYoutubeIndex === null) return;

    const trimmedUrl = editYoutubeInput.trim();

    if (!trimmedUrl) {
      toast.error("URL YouTube tidak boleh kosong");
      return;
    }

    if (!isValidYouTubeUrl(trimmedUrl)) {
      toast.error("URL YouTube tidak valid");
      return;
    }

    if (editYoutubeUrls.some((url, idx) => idx !== editingYoutubeIndex && url === trimmedUrl)) {
      toast.warning("URL YouTube ini sudah ditambahkan");
      return;
    }

    const newUrls = [...editYoutubeUrls];
    newUrls[editingYoutubeIndex] = trimmedUrl;
    setEditYoutubeUrls(newUrls);
    setEditingYoutubeIndex(null);
    setEditYoutubeInput("");
    toast.success("URL YouTube berhasil diperbarui!");
  };

  const cancelEditYouTubeUrl = () => {
    setEditingYoutubeIndex(null);
    setEditYoutubeInput("");
  };

  // Fungsi untuk Images
  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const totalImages = editImages.length + newImageFiles.length + files.length;
    if (totalImages > 6) {
      toast.warning("Maksimal 6 gambar");
      return;
    }

    const oversizedFiles = files.filter((file) => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error("Beberapa file melebihi ukuran maksimal 5MB");
      return;
    }

    setNewImageFiles((prev) => [...prev, ...files]);
    setNewImagePreviews((prev) => [...prev, ...files.map((file) => URL.createObjectURL(file))]);
    toast.success(`${files.length} gambar ditambahkan`);
  };

  const removeExistingImage = (index: number) => {
    setEditImages(editImages.filter((_, i) => i !== index));
    toast.success("Gambar dihapus");
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles(newImageFiles.filter((_, i) => i !== index));
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index));
    toast.success("Gambar dihapus");
  };

  const uploadImagesToCloudinary = async (files: File[]) => {
    const uploadedUrls: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      uploadedUrls.push(data.secure_url);
    }
    return uploadedUrls;
  };

  const handleUpdate = async () => {
    if (!blog || !isOwner) {
      toast.error("Anda tidak memiliki izin untuk mengedit blog ini");
      return;
    }

    if (!editTitle.trim() || !editContent.trim()) {
      toast.error("Judul dan konten tidak boleh kosong!");
      return;
    }

    setUpdating(true);
    const loadingToast = toast.loading("Memperbarui blog...");

    try {
      // Upload gambar baru ke Cloudinary jika ada
      let newUploadedUrls: string[] = [];
      if (newImageFiles.length > 0) {
        toast.update(loadingToast, {
          render: "Mengunggah gambar baru...",
          isLoading: true,
        });
        newUploadedUrls = await uploadImagesToCloudinary(newImageFiles);
      }

      // Gabungkan gambar lama yang tidak dihapus dengan gambar baru
      const finalImages = [...editImages, ...newUploadedUrls];

      const blogRef = doc(db, "blogs", id as string);
      await updateDoc(blogRef, {
        title: editTitle.trim(),
        content: editContent.trim(),
        youtubeUrls: editYoutubeUrls,
        images: finalImages,
        updatedAt: new Date(),
      });

      setBlog((prev) =>
        prev
          ? {
              ...prev,
              title: editTitle,
              content: editContent,
              youtubeUrls: editYoutubeUrls,
              images: finalImages,
            }
          : null
      );

      // Reset state
      setIsEditing(false);
      setNewImageFiles([]);
      setNewImagePreviews([]);

      toast.update(loadingToast, {
        render: "Blog berhasil diperbarui! 🎉",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error updating blog:", error);
      toast.update(loadingToast, {
        render: "Gagal memperbarui blog. Silakan coba lagi.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setUpdating(false);
    }
  };

  const cancelEdit = () => {
    setEditTitle(blog?.title || "");
    setEditContent(blog?.content || "");
    setEditYoutubeUrls(blog?.youtubeUrls || []);
    setEditImages(blog?.images || []);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setYoutubeInput("");
    setEditingYoutubeIndex(null);
    setEditYoutubeInput("");
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
              {/* Edit/Save Button - hanya untuk pemilik atau admin */}
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
              
              {/* Delete Button - hanya untuk pemilik atau admin */}
              {isOwner && blog.authorId && (
                <DeleteBlogButton 
                  blogId={id as string}
                  authorId={blog.authorId}
                  authorEmail={blog.authorEmail}
                  blogTitle={blog.title}
                  onDelete={handleBlogDelete}
                />
              )}
              
              {/* Admin Badge */}
              {isAdmin && (
                <div className="flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 px-3 py-2 rounded-xl">
                  <FiSettings className="text-sm" />
                  <span className="text-sm">Admin</span>
                </div>
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

            {/* Status & Media Badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              {/* Status Badge */}
              {blog.status && (
                <span className={`px-3 py-1 rounded-full text-sm ${
                  blog.status === 'published' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : blog.status === 'draft'
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}>
                  Status: {blog.status}
                </span>
              )}

              {/* YouTube Badge */}
              {blog.youtubeUrls && blog.youtubeUrls.length > 0 && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-500/20 text-red-400 border border-red-500/30">
                  <FiYoutube className="text-sm" />
                  <span>{blog.youtubeUrls.length} Video</span>
                </span>
              )}

              {/* Images Badge */}
              {blog.images && blog.images.length > 0 && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <FiImage className="text-sm" />
                  <span>{blog.images.length} Gambar</span>
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* YouTube Videos Section */}
            {isEditing ? (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <FiYoutube className="text-red-500" />
                  Edit Video YouTube
                  <span className="text-sm text-gray-400 font-normal">(Maks. 3 video)</span>
                </h2>

                {/* Add YouTube URL */}
                {editYoutubeUrls.length < 3 && (
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4 mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tambah URL YouTube
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={youtubeInput}
                        onChange={(e) => setYoutubeInput(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="flex-1 bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={addYouTubeUrl}
                        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        <FiPlus className="text-sm" />
                        Tambah
                      </button>
                    </div>
                  </div>
                )}

                {/* YouTube URLs List */}
                {editYoutubeUrls.length > 0 && (
                  <div className="space-y-3">
                    {editYoutubeUrls.map((url, index) => {
                      const videoId = extractYouTubeId(url);
                      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                      const isEditingThis = editingYoutubeIndex === index;

                      return (
                        <div key={index} className="bg-black/20 border border-white/10 rounded-lg p-3">
                          {isEditingThis ? (
                            <div className="space-y-3">
                              <input
                                type="url"
                                value={editYoutubeInput}
                                onChange={(e) => setEditYoutubeInput(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="w-full bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={saveEditYouTubeUrl}
                                  className="flex items-center gap-1 bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg text-sm font-medium"
                                >
                                  <FiCheck className="text-sm" />
                                  Simpan
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditYouTubeUrl}
                                  className="bg-gray-500 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium"
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="shrink-0 w-20 h-12 bg-gray-700 rounded overflow-hidden">
                                {videoId && (
                                  <img src={thumbnailUrl} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">Video {index + 1}</p>
                                <p className="text-xs text-gray-400 truncate">{url}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => startEditYouTubeUrl(index)}
                                  className="text-blue-400 hover:text-blue-300 p-1"
                                  title="Edit video"
                                >
                                  <FiEdit2 className="text-lg" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeYouTubeUrl(index)}
                                  className="text-red-400 hover:text-red-300 p-1"
                                  title="Hapus video"
                                >
                                  <FiTrash2 className="text-lg" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {editYoutubeUrls.length === 0 && (
                  <p className="text-center text-gray-500 py-4">Belum ada video YouTube</p>
                )}
              </motion.section>
            ) : (
              blog.youtubeUrls && blog.youtubeUrls.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-12"
                >
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <FiYoutube className="text-red-500" />
                    Video YouTube
                  </h2>
                  <div className="space-y-6">
                    {blog.youtubeUrls.map((url, index) => (
                      <YouTubeEmbed
                        key={index}
                        url={url}
                        title={`${blog.title} - Video ${index + 1}`}
                      />
                    ))}
                  </div>
                </motion.section>
              )
            )}

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
                transition={{ delay: 0.5 }}
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
            {isEditing ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12 bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <FiImage className="text-purple-400" />
                  Edit Galeri Gambar
                  <span className="text-sm text-gray-400 font-normal">(Maks. 6 gambar)</span>
                </h3>

                {/* Upload New Images */}
                {(editImages.length + newImageFiles.length) < 6 && (
                  <div className="mb-6">
                    <label className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 px-5 py-3 rounded-xl cursor-pointer transition-all w-full sm:w-auto">
                      <FiPlus className="text-lg" />
                      <span>Tambah Gambar Baru</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleAddImages}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-400 mt-2">
                      Maksimal 5MB per gambar. Total: {editImages.length + newImageFiles.length}/6
                    </p>
                  </div>
                )}

                {/* Existing Images */}
                {editImages.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-3 text-gray-300">Gambar Saat Ini</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {editImages.map((img, i) => (
                        <div
                          key={`existing-${i}`}
                          className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/20"
                        >
                          <img
                            src={img}
                            alt={`existing-${i}`}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeExistingImage(i)}
                              className="bg-red-500 hover:bg-red-600 p-2 rounded-full transition-colors"
                              title="Hapus gambar"
                            >
                              <FiTrash2 className="text-white text-sm" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images to Upload */}
                {newImageFiles.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-3 text-gray-300">Gambar Baru (Belum Disimpan)</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {newImagePreviews.map((preview, i) => (
                        <div
                          key={`new-${i}`}
                          className="relative group rounded-xl overflow-hidden border border-purple-500/50 bg-black/20"
                        >
                          <img
                            src={preview}
                            alt={`new-${i}`}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded">
                            Baru
                          </div>
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeNewImage(i)}
                              className="bg-red-500 hover:bg-red-600 p-2 rounded-full transition-colors"
                              title="Hapus gambar"
                            >
                              <FiTrash2 className="text-white text-sm" />
                            </button>
                          </div>
                          <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs truncate max-w-[calc(100%-1rem)]">
                            {newImageFiles[i]?.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {editImages.length === 0 && newImageFiles.length === 0 && (
                  <p className="text-center text-gray-500 py-4">Belum ada gambar</p>
                )}
              </motion.div>
            ) : (
              blog.images && blog.images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-12"
                >
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <FiImage className="text-purple-400" />
                    Galeri Gambar
                  </h3>
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
              )
            )}
          </div>

          {/* Owner/Admin Badge */}
          {isOwner && (
            <div className="px-8 pb-6">
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                <p className="text-blue-400 text-sm text-center">
                  {isAdmin ? '🛠️ Anda adalah admin. Anda dapat mengedit atau menghapus blog ini.' : '🛠️ Anda adalah pemilik blog ini. Anda dapat mengedit atau menghapus blog ini.'}
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