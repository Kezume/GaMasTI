"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, getDocs, collection } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion, AnimatePresence } from "framer-motion";
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
  FiTrash2,
  FiType,
  FiFileText,
  FiArrowUp,
  FiArrowDown,
  FiCode,
  FiEye,
  FiDownload,
  FiVideo,
} from "react-icons/fi";
import DeleteBlogButton from "@/components/DeleteBlogButton";
import YouTubeEmbed from "@/components/YoutubeEmbed";
import { toast } from "react-toastify";

interface Blog {
  title: string;
  content?: string; // Optional for backwards compatibility
  images?: string[];
  youtubeUrls?: string[];
  contentBlocks?: ContentBlock[];
  authorName?: string;
  authorAvatar?: string;
  authorId?: string;
  authorEmail?: string;
  githubUrl?: string;
  status?: string;
  createdAt?: { seconds: number };
  views?: number;
}

// Interface untuk Content Blocks
type ContentBlockType = "subtitle" | "text" | "image" | "youtube" | "code" | "file" | "video";

interface ContentBlock {
  id: string;
  type: ContentBlockType;
  content: string;
  language?: string;
  fileUrl?: string;
  fileName?: string;
}

interface ContentBlock {
  id: string;
  type: ContentBlockType;
  content: string;
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
  const [editContentBlocks, setEditContentBlocks] = useState<ContentBlock[]>([]);
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

  // State untuk modal content block
  const [showBlockModal, setShowBlockModal] = useState(false);

  // Helper function to get GitHub URL
  const getGitHubUrl = (githubUrl?: string): string => {
    if (!githubUrl) return "";

    // Jika sudah format URL lengkap
    if (githubUrl.startsWith("http://") || githubUrl.startsWith("https://")) {
      return githubUrl;
    }

    // Jika format github.com/username
    if (githubUrl.startsWith("github.com/")) {
      return `https://${githubUrl}`;
    }

    // Jika hanya username
    return `https://github.com/${githubUrl}`;
  };

  // Helper function to get GitHub username
  const getGitHubUsername = (githubUrl?: string): string => {
    if (!githubUrl) return "";

    // Extract username dari berbagai format
    const username = githubUrl.split("/").pop() || githubUrl;
    return username.replace("@", "");
  };

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
    const fetchBlog = async () => {
      try {
        const docRef = doc(db, "blogs", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const blogData = docSnap.data() as Blog;
          setBlog(blogData);
          setEditTitle(blogData.title);
          setEditContent(blogData.content || "");
          setEditContentBlocks(blogData.contentBlocks || []);
          setEditYoutubeUrls(blogData.youtubeUrls || []);
          setEditImages(blogData.images || []);

          // Increment views count
          const currentViews = blogData.views || 0;
          await updateDoc(docRef, {
            views: currentViews + 1,
          });

          // Update local state with incremented views
          setBlog({ ...blogData, views: currentViews + 1 });
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

      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      uploadedUrls.push(data.secure_url);
    }
    return uploadedUrls;
  };

  // Fungsi untuk Content Blocks
  const generateId = () => Math.random().toString(36).substring(2, 11);

  const addContentBlock = (type: ContentBlockType) => {
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      content: "",
    };
    setEditContentBlocks([...editContentBlocks, newBlock]);
  };

  const updateContentBlock = (id: string, content: string) => {
    setEditContentBlocks(editContentBlocks.map((block) => (block.id === id ? { ...block, content } : block)));
  };

  const removeContentBlock = (id: string) => {
    setEditContentBlocks(editContentBlocks.filter((block) => block.id !== id));
    toast.success("Block dihapus");
  };

  const moveContentBlockUp = (index: number) => {
    if (index === 0) return; // Already at top
    const newBlocks = [...editContentBlocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    setEditContentBlocks(newBlocks);
  };

  const moveContentBlockDown = (index: number) => {
    if (index === editContentBlocks.length - 1) return; // Already at bottom
    const newBlocks = [...editContentBlocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    setEditContentBlocks(newBlocks);
  };

  const uploadBlockImage = async (id: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 5MB");
      return;
    }

    const loadingToast = toast.loading("Mengunggah gambar...");
    try {
      const imageUrl = await uploadImagesToCloudinary([file]);
      updateContentBlock(id, imageUrl[0]);
      toast.update(loadingToast, {
        render: "Gambar berhasil diunggah!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.update(loadingToast, {
        render: "Gagal mengunggah gambar",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleUpdate = async () => {
    if (!blog || !isOwner) {
      toast.error("Anda tidak memiliki izin untuk mengedit blog ini");
      return;
    }

    if (!editTitle.trim()) {
      toast.error("Judul tidak boleh kosong!");
      return;
    }

    // Validasi content blocks jika ada
    if (editContentBlocks.length > 0) {
      for (const block of editContentBlocks) {
        if (!block.content.trim()) {
          toast.error(`Block ${block.type} tidak boleh kosong`);
          return;
        }
        if (block.type === "youtube" && !isValidYouTubeUrl(block.content)) {
          toast.error("URL YouTube tidak valid");
          return;
        }
      }
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

      // Update dengan content blocks jika ada, atau gunakan format lama
      const updateData: any = {
        title: editTitle.trim(),
        updatedAt: new Date(),
      };

      if (editContentBlocks.length > 0) {
        updateData.contentBlocks = editContentBlocks;
        // Hapus field lama jika migrasi ke format baru
        updateData.content = null;
      } else if (editContent) {
        // Backward compatibility: jika tidak ada blocks tapi ada content lama
        updateData.content = editContent.trim();
      }

      // Tambahkan data legacy jika ada
      if (editYoutubeUrls.length > 0) {
        updateData.youtubeUrls = editYoutubeUrls;
      }
      if (finalImages.length > 0) {
        updateData.images = finalImages;
      }

      await updateDoc(blogRef, updateData);

      setBlog((prev) =>
        prev
          ? {
              ...prev,
              title: editTitle,
              content: updateData.content,
              contentBlocks: updateData.contentBlocks,
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
    setEditContentBlocks(blog?.contentBlocks || []);
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
    return new Date(seconds * 1000).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (seconds: number) => {
    return new Date(seconds * 1000).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const estimateReadTime = (content: string | undefined) => {
    if (!content) return "1 menit membaca";
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} menit membaca`;
  };

  const shareBlog = async () => {
    const description = blog?.content ? blog.content.substring(0, 100) + "..." : "Blog menarik dari GaMasTI";

    if (navigator.share) {
      try {
        await navigator.share({
          title: blog?.title,
          text: description,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link berhasil disalin ke clipboard!");
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
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
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
                        {updating ? <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" /> : <FiSave className="text-sm" />}
                        <span>{updating ? "Menyimpan..." : "Simpan"}</span>
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
              {isOwner && blog.authorId && <DeleteBlogButton blogId={id as string} authorId={blog.authorId} authorEmail={blog.authorEmail} blogTitle={blog.title} onDelete={handleBlogDelete} />}

              {/* Admin Badge */}
              {isAdmin && (
                <div className="flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 px-3 py-2 rounded-xl">
                  <FiSettings className="text-sm" />
                  <span className="text-sm">Admin</span>
                </div>
              )}

              <button onClick={shareBlog} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-xl transition-all">
                <FiShare2 className="text-sm" />
                <span>Bagikan</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-24 pb-16">
        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
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
                <div className="text-right text-sm text-gray-500">{editTitle.length}/100 karakter</div>
              </div>
            ) : (
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-3xl sm:text-4xl font-bold mb-6 leading-tight">
                {blog.title}
              </motion.h1>
            )}

            {/* Author & Meta Info */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img src={blog.authorAvatar || "/default-avatar.png"} alt={blog.authorName} className="w-12 h-12 rounded-full border-2 border-white/20" />
                <div>
                  <p className="font-semibold text-lg">{blog.authorName || "Anonim"}</p>
                  {blog.githubUrl && (
                    <a href={getGitHubUrl(blog.githubUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors text-sm">
                      <FiGithub className="text-sm" />
                      <span>@{getGitHubUsername(blog.githubUrl)}</span>
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
                {/* Views Counter */}
                <div className="flex items-center gap-1 text-cyan-400">
                  <FiEye className="text-sm" />
                  <span>{blog.views || 0} views</span>
                </div>
              </div>
            </motion.div>

            {/* Status & Media Badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              {/* Status Badge */}
              {blog.status && (
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    blog.status === "published"
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : blog.status === "draft"
                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                  }`}
                >
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
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <FiYoutube className="text-red-500" />
                  Edit Video YouTube
                  <span className="text-sm text-gray-400 font-normal">(Maks. 3 video)</span>
                </h2>

                {/* Add YouTube URL */}
                {editYoutubeUrls.length < 3 && (
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4 mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Tambah URL YouTube</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={youtubeInput}
                        onChange={(e) => setYoutubeInput(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="flex-1 bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                      />
                      <button type="button" onClick={addYouTubeUrl} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-medium transition-colors">
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
                                <button type="button" onClick={saveEditYouTubeUrl} className="flex items-center gap-1 bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg text-sm font-medium">
                                  <FiCheck className="text-sm" />
                                  Simpan
                                </button>
                                <button type="button" onClick={cancelEditYouTubeUrl} className="bg-gray-500 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium">
                                  Batal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="shrink-0 w-20 h-12 bg-gray-700 rounded overflow-hidden">{videoId && <img src={thumbnailUrl} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />}</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">Video {index + 1}</p>
                                <p className="text-xs text-gray-400 truncate">{url}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button type="button" onClick={() => startEditYouTubeUrl(index)} className="text-blue-400 hover:text-blue-300 p-1" title="Edit video">
                                  <FiEdit2 className="text-lg" />
                                </button>
                                <button type="button" onClick={() => removeYouTubeUrl(index)} className="text-red-400 hover:text-red-300 p-1" title="Hapus video">
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

                {editYoutubeUrls.length === 0 && <p className="text-center text-gray-500 py-4">Belum ada video YouTube</p>}
              </motion.section>
            ) : (
              blog.youtubeUrls &&
              blog.youtubeUrls.length > 0 && (
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-12">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <FiYoutube className="text-red-500" />
                    Video YouTube
                  </h2>
                  <div className="space-y-6">
                    {blog.youtubeUrls.map((url, index) => (
                      <YouTubeEmbed key={index} url={url} title={`${blog.title} - Video ${index + 1}`} />
                    ))}
                  </div>
                </motion.section>
              )
            )}

            {/* Content Blocks Section */}
            {isEditing ? (
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FiFileText className="text-green-500" />
                  Konten Blog
                </h2>

                {/* Content Blocks List */}
                {editContentBlocks.map((block, index) => (
                  <div key={block.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        {block.type === "subtitle" && (
                          <>
                            <FiType /> Sub Judul
                          </>
                        )}
                        {block.type === "text" && (
                          <>
                            <FiFileText /> Konten Teks
                          </>
                        )}
                        {block.type === "youtube" && (
                          <>
                            <FiYoutube /> Video YouTube
                          </>
                        )}
                        {block.type === "image" && (
                          <>
                            <FiImage /> Gambar
                          </>
                        )}
                        {block.type === "code" && (
                          <>
                            <FiCode /> Kode
                          </>
                        )}
                        {block.type === "file" && (
                          <>
                            <FiDownload /> File Download
                          </>
                        )}
                        {block.type === "video" && (
                          <>
                            <FiVideo /> Video Google Drive
                          </>
                        )}
                        <span className="text-gray-600">#{index + 1}</span>
                      </div>

                      {/* Control Buttons */}
                      <div className="flex items-center gap-2">
                        {/* Move Up Button */}
                        <button
                          type="button"
                          onClick={() => moveContentBlockUp(index)}
                          disabled={index === 0}
                          className={`p-1.5 rounded transition-colors ${index === 0 ? "text-gray-600 cursor-not-allowed" : "text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"}`}
                          title="Pindah ke atas"
                        >
                          <FiArrowUp />
                        </button>

                        {/* Move Down Button */}
                        <button
                          type="button"
                          onClick={() => moveContentBlockDown(index)}
                          disabled={index === editContentBlocks.length - 1}
                          className={`p-1.5 rounded transition-colors ${index === editContentBlocks.length - 1 ? "text-gray-600 cursor-not-allowed" : "text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"}`}
                          title="Pindah ke bawah"
                        >
                          <FiArrowDown />
                        </button>

                        {/* Delete Button */}
                        <button type="button" onClick={() => removeContentBlock(block.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1.5 rounded transition-colors" title="Hapus block">
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>

                    {block.type === "subtitle" && (
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateContentBlock(block.id, e.target.value)}
                        placeholder="Masukkan sub judul..."
                        className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-xl font-semibold text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    )}

                    {block.type === "text" && (
                      <textarea
                        value={block.content}
                        onChange={(e) => updateContentBlock(block.id, e.target.value)}
                        placeholder="Tulis konten blog Anda di sini..."
                        rows={6}
                        className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      />
                    )}

                    {block.type === "youtube" && (
                      <div>
                        <input
                          type="url"
                          value={block.content}
                          onChange={(e) => updateContentBlock(block.id, e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-red-500 outline-none"
                        />
                        {block.content && isValidYouTubeUrl(block.content) && (
                          <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                            <FiYoutube /> URL YouTube valid ✓
                          </div>
                        )}
                        {block.content && !isValidYouTubeUrl(block.content) && <div className="mt-2 text-xs text-red-400">URL YouTube tidak valid</div>}
                      </div>
                    )}

                    {block.type === "image" && (
                      <div>
                        {!block.content ? (
                          <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-lg p-6 cursor-pointer hover:border-purple-500/50 transition-colors">
                            <FiImage className="text-3xl text-gray-400 mb-2" />
                            <span className="text-sm text-gray-400">Klik untuk upload gambar</span>
                            <span className="text-xs text-gray-500 mt-1">Maksimal 5MB</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadBlockImage(block.id, file);
                              }}
                              className="hidden"
                            />
                          </label>
                        ) : (
                          <div className="relative">
                            <img src={block.content} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                            <button type="button" onClick={() => updateContentBlock(block.id, "")} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full" title="Ganti gambar">
                              <FiTrash2 />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {block.type === "code" && (
                      <div className="space-y-2">
                        <select
                          value={block.language || "javascript"}
                          onChange={(e) => {
                            const newBlocks = editContentBlocks.map((b) => (b.id === block.id ? { ...b, language: e.target.value } : b));
                            setEditContentBlocks(newBlocks);
                          }}
                          className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="typescript">TypeScript</option>
                          <option value="python">Python</option>
                          <option value="java">Java</option>
                          <option value="cpp">C++</option>
                          <option value="csharp">C#</option>
                          <option value="html">HTML</option>
                          <option value="css">CSS</option>
                          <option value="sql">SQL</option>
                          <option value="bash">Bash</option>
                          <option value="json">JSON</option>
                          <option value="xml">XML</option>
                        </select>
                        <textarea
                          value={block.content}
                          onChange={(e) => updateContentBlock(block.id, e.target.value)}
                          placeholder="Paste kode Anda di sini..."
                          rows={10}
                          className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-orange-500 outline-none resize-none font-mono text-sm"
                          spellCheck={false}
                        />
                      </div>
                    )}

                    {block.type === "file" && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Nama File</label>
                          <input
                            type="text"
                            value={block.fileName || ""}
                            onChange={(e) => {
                              const newBlocks = editContentBlocks.map((b) => (b.id === block.id ? { ...b, fileName: e.target.value } : b));
                              setEditContentBlocks(newBlocks);
                            }}
                            placeholder="Contoh: Document.pdf"
                            className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-cyan-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">URL File atau Upload (Max 10MB)</label>
                          <input
                            type="text"
                            value={block.fileUrl || block.content || ""}
                            onChange={(e) => {
                              const newBlocks = editContentBlocks.map((b) => (b.id === block.id ? { ...b, fileUrl: e.target.value, content: e.target.value } : b));
                              setEditContentBlocks(newBlocks);
                            }}
                            placeholder="https://..."
                            className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-cyan-500 outline-none"
                          />
                        </div>
                        {(block.fileUrl || block.content) && (
                          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-cyan-400">
                              <FiDownload />
                              <span>File siap didownload: {block.fileName || "File"}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {block.type === "video" && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">URL Google Drive Video</label>
                          <input
                            type="url"
                            value={block.content}
                            onChange={(e) => updateContentBlock(block.id, e.target.value)}
                            placeholder="https://drive.google.com/file/d/..."
                            className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-pink-500 outline-none"
                          />
                          <p className="text-xs text-gray-400 mt-1">Paste link Google Drive video Anda</p>
                        </div>
                        {block.content && block.content.includes("drive.google.com") && (
                          <div className="p-3 bg-pink-500/10 border border-pink-500/30 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-pink-400">
                              <FiVideo />
                              <span>URL Google Drive valid ✓</span>
                            </div>
                          </div>
                          // gegege
                        )}
                        {block.content && !block.content.includes("drive.google.com") && <div className="text-xs text-red-400">URL harus dari Google Drive</div>}
                      </div>
                    )}
                  </div>
                ))}

                {editContentBlocks.length === 0 && <div className="text-center py-8 text-gray-500 border-2 border-dashed border-white/10 rounded-xl">Belum ada konten. Tambahkan block di bawah.</div>}

                {/* Add Block Button */}
                <button
                  type="button"
                  onClick={() => setShowBlockModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-4 py-3 rounded-xl font-medium transition-all shadow-lg"
                >
                  <FiPlus className="text-lg" />
                  <span>Tambah Konten Blog</span>
                </button>
              </motion.section>
            ) : (
              /* Display Content Blocks */
              blog.contentBlocks &&
              blog.contentBlocks.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-8">
                  {blog.contentBlocks.map((block, index) => (
                    <motion.div key={block.id || index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }}>
                      {block.type === "subtitle" && block.content && <h2 className="text-2xl sm:text-3xl font-bold text-white mt-8 mb-4">{block.content}</h2>}

                      {block.type === "text" && block.content && (
                        <div className="prose prose-invert max-w-none prose-lg">
                          <div className="whitespace-pre-line leading-relaxed text-gray-300 text-lg">
                            {block.content.split("\n").map((paragraph, i) => (
                              <p key={i} className="mb-4">
                                {paragraph || <br />}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {block.type === "image" && block.content && (
                        <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/20 cursor-pointer hover:opacity-90 transition-opacity max-h-96" onClick={() => setSelectedImage(block.content)}>
                          <img src={block.content} alt={`content-${index}`} className="w-full h-full max-h-96 object-cover" />
                        </div>
                      )}

                      {block.type === "youtube" && block.content && (
                        <div className="my-6">
                          <YouTubeEmbed url={block.content} title={`${blog.title} - Video ${index + 1}`} />
                        </div>
                      )}

                      {block.type === "code" && block.content && (
                        <div className="my-6">
                          <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden">
                            <div className="bg-orange-500/10 px-4 py-2 border-b border-white/10 flex items-center gap-2">
                              <FiCode className="text-orange-400" />
                              <span className="text-sm text-orange-400 font-medium">{block.language || "code"}</span>
                            </div>
                            <pre className="p-4 overflow-x-auto">
                              <code className="text-sm font-mono text-gray-300">{block.content}</code>
                            </pre>
                          </div>
                        </div>
                      )}

                      {block.type === "file" && (block.content || block.fileUrl) && (
                        <div className="my-6">
                          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 hover:bg-blue-500/20 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-lg font-semibold text-white mb-1">{block.fileName || block.content || "Download File"}</p>
                                <p className="text-sm text-gray-400">Klik tombol untuk download</p>
                              </div>
                              <a
                                href={block.fileUrl || block.content}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all shrink-0"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {block.type === "video" && block.content && (
                        <div className="my-6">
                          <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl overflow-hidden">
                            <div className="bg-pink-500/10 px-4 py-2 border-b border-pink-500/30 flex items-center gap-2">
                              <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm text-pink-400 font-medium">Video Google Drive</span>
                            </div>
                            <div className="aspect-video bg-black">
                              <iframe src={block.content.includes("drive.google.com") ? block.content.replace("/view", "/preview") : block.content} className="w-full h-full" allow="autoplay" allowFullScreen></iframe>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )
            )}

            {/* Legacy Content Display - for backward compatibility */}
            {!isEditing && blog.content && (!blog.contentBlocks || blog.contentBlocks.length === 0) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="prose prose-invert max-w-none prose-lg">
                <div className="whitespace-pre-line leading-relaxed text-gray-300 text-lg">
                  {blog.content.split("\n").map((paragraph, index) => (
                    <p key={index} className="mb-6">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Images Gallery - Legacy support */}
            {isEditing ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <FiImage className="text-purple-400" />
                  Edit Galeri Gambar
                  <span className="text-sm text-gray-400 font-normal">(Maks. 6 gambar)</span>
                </h3>

                {/* Upload New Images */}
                {editImages.length + newImageFiles.length < 6 && (
                  <div className="mb-6">
                    <label className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 px-5 py-3 rounded-xl cursor-pointer transition-all w-full sm:w-auto">
                      <FiPlus className="text-lg" />
                      <span>Tambah Gambar Baru</span>
                      <input type="file" accept="image/*" multiple onChange={handleAddImages} className="hidden" />
                    </label>
                    <p className="text-xs text-gray-400 mt-2">Maksimal 5MB per gambar. Total: {editImages.length + newImageFiles.length}/6</p>
                  </div>
                )}

                {/* Existing Images */}
                {editImages.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-3 text-gray-300">Gambar Saat Ini</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {editImages.map((img, i) => (
                        <div key={`existing-${i}`} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/20">
                          <img src={img} alt={`existing-${i}`} className="w-full h-32 object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button type="button" onClick={() => removeExistingImage(i)} className="bg-red-500 hover:bg-red-600 p-2 rounded-full transition-colors" title="Hapus gambar">
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
                        <div key={`new-${i}`} className="relative group rounded-xl overflow-hidden border border-purple-500/50 bg-black/20">
                          <img src={preview} alt={`new-${i}`} className="w-full h-32 object-cover" />
                          <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded">Baru</div>
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button type="button" onClick={() => removeNewImage(i)} className="bg-red-500 hover:bg-red-600 p-2 rounded-full transition-colors" title="Hapus gambar">
                              <FiTrash2 className="text-white text-sm" />
                            </button>
                          </div>
                          <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs truncate max-w-[calc(100%-1rem)]">{newImageFiles[i]?.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {editImages.length === 0 && newImageFiles.length === 0 && <p className="text-center text-gray-500 py-4">Belum ada gambar</p>}
              </motion.div>
            ) : (
              blog.images &&
              blog.images.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-12">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <FiImage className="text-purple-400" />
                    Galeri Gambar
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {blog.images.map((img, i) => (
                      <motion.div key={i} whileHover={{ scale: 1.02 }} className="relative group cursor-pointer rounded-2xl overflow-hidden border border-white/10 bg-black/20" onClick={() => setSelectedImage(img)}>
                        <img src={img} alt={`image-${i}`} className="w-full h-64 object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="text-white text-sm bg-black/70 px-3 py-2 rounded-lg">Klik untuk memperbesar</div>
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
                <p className="text-blue-400 text-sm text-center">{isAdmin ? "🛠️ Anda adalah admin. Anda dapat mengedit atau menghapus blog ini." : "🛠️ Anda adalah pemilik blog ini. Anda dapat mengedit atau menghapus blog ini."}</p>
              </div>
            </div>
          )}
        </motion.article>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
              <img src={selectedImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg" />
              <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full transition-colors">
                <FiX className="text-xl" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Tambah Konten Blog */}
      <AnimatePresence>
        {showBlockModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" onClick={() => setShowBlockModal(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Tambah Konten Blog</h3>
                  <p className="text-sm text-gray-400 mt-1">Pilih tipe konten yang ingin ditambahkan</p>
                </div>
                <button onClick={() => setShowBlockModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <FiX className="text-xl text-gray-400" />
                </button>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    addContentBlock("subtitle");
                    setShowBlockModal(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-lg transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <FiType className="text-blue-400 text-lg" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Subjudul</p>
                    <p className="text-xs text-gray-400">Tambah heading section</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    addContentBlock("text");
                    setShowBlockModal(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-lg transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <FiFileText className="text-green-400 text-lg" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Teks</p>
                    <p className="text-xs text-gray-400">Paragraf konten</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    addContentBlock("youtube");
                    setShowBlockModal(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-lg transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <FiYoutube className="text-red-400 text-lg" />
                  </div>
                  <div>
                    <p className="font-medium text-white">YouTube</p>
                    <p className="text-xs text-gray-400">Embed video YouTube</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    addContentBlock("image");
                    setShowBlockModal(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-lg transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <FiImage className="text-purple-400 text-lg" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Gambar</p>
                    <p className="text-xs text-gray-400">Upload gambar (Max 5MB)</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    addContentBlock("code");
                    setShowBlockModal(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-lg transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <FiCode className="text-orange-400 text-lg" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Kode</p>
                    <p className="text-xs text-gray-400">Code snippet dengan syntax</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    addContentBlock("file");
                    setShowBlockModal(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-lg transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <FiDownload className="text-cyan-400 text-lg" />
                  </div>
                  <div>
                    <p className="font-medium text-white">File Download</p>
                    <p className="text-xs text-gray-400">Link download file (Max 10MB)</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    addContentBlock("video");
                    setShowBlockModal(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-lg transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <FiVideo className="text-pink-400 text-lg" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Video Google Drive</p>
                    <p className="text-xs text-gray-400">Embed video dari Google Drive</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
