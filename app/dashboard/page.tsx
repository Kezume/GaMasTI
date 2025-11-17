// app/dashboard/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { db, auth } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp, doc, setDoc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion, AnimatePresence } from "framer-motion";
import { FiImage, FiUpload, FiX, FiFileText, FiType, FiYoutube, FiArrowLeft, FiEye, FiTrash2, FiArrowUp, FiArrowDown, FiEdit2, FiCode, FiLayout, FiDownload, FiLink, FiVideo, FiPlus } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ConfirmModal from "@/components/ConfirmModal";
import YoutubeEmbed from "@/components/YoutubeEmbed";

// Interface untuk Content Blocks
type ContentBlockType = "subtitle" | "text" | "youtube" | "image" | "code" | "file" | "video";

interface ContentBlock {
  id: string;
  type: ContentBlockType;
  content: string;
  language?: string;
  fileName?: string; // untuk file block
  fileUrl?: string; // untuk file/video block
}

// Template Formasi
interface BlogTemplate {
  name: string;
  description: string;
  icon: string;
  blocks: Omit<ContentBlock, "id">[];
}

const blogTemplates: BlogTemplate[] = [
  {
    name: "Tutorial Coding",
    description: "Template untuk tutorial pemrograman dengan code snippets",
    icon: "💻",
    blocks: [
      { type: "subtitle", content: "Pendahuluan" },
      { type: "text", content: "Jelaskan tujuan dan apa yang akan dipelajari di tutorial ini..." },
      { type: "subtitle", content: "Instalasi & Setup" },
      { type: "text", content: "Langkah-langkah instalasi tools yang diperlukan..." },
      { type: "code", content: "// Contoh code installation\nnpm install package-name", language: "javascript" },
      { type: "subtitle", content: "Implementasi" },
      { type: "text", content: "Penjelasan implementasi step by step..." },
      { type: "code", content: "// Tulis code implementation di sini", language: "javascript" },
      { type: "subtitle", content: "Kesimpulan" },
      { type: "text", content: "Ringkasan dan next steps..." },
    ],
  },
  {
    name: "Review Project",
    description: "Template untuk review atau showcase project",
    icon: "🚀",
    blocks: [
      { type: "subtitle", content: "Overview Project" },
      { type: "text", content: "Deskripsi singkat tentang project..." },
      { type: "image", content: "" },
      { type: "subtitle", content: "Teknologi yang Digunakan" },
      { type: "text", content: "- Framework: \n- Database: \n- Tools: " },
      { type: "subtitle", content: "Fitur Utama" },
      { type: "text", content: "1. Fitur pertama...\n2. Fitur kedua...\n3. Fitur ketiga..." },
      { type: "subtitle", content: "Demo" },
      { type: "youtube", content: "" },
      { type: "subtitle", content: "Source Code" },
      { type: "text", content: "Link repository: " },
    ],
  },
  {
    name: "Blog Article",
    description: "Template untuk artikel blog umum",
    icon: "📝",
    blocks: [
      { type: "text", content: "Paragraf pembuka yang menarik perhatian pembaca..." },
      { type: "image", content: "" },
      { type: "subtitle", content: "Poin Pertama" },
      { type: "text", content: "Penjelasan detail tentang poin pertama..." },
      { type: "subtitle", content: "Poin Kedua" },
      { type: "text", content: "Penjelasan detail tentang poin kedua..." },
      { type: "subtitle", content: "Poin Ketiga" },
      { type: "text", content: "Penjelasan detail tentang poin ketiga..." },
      { type: "subtitle", content: "Kesimpulan" },
      { type: "text", content: "Rangkuman dan call-to-action..." },
    ],
  },
  {
    name: "Video Tutorial",
    description: "Template untuk konten berbasis video YouTube",
    icon: "🎥",
    blocks: [
      { type: "text", content: "Pengantar singkat tentang apa yang akan dijelaskan di video..." },
      { type: "youtube", content: "" },
      { type: "subtitle", content: "Poin-Poin Penting" },
      { type: "text", content: "Timestamps:\n0:00 - Intro\n2:30 - Part 1\n5:45 - Part 2\n10:00 - Conclusion" },
      { type: "subtitle", content: "Resources" },
      { type: "text", content: "Link dan resources yang disebutkan di video..." },
      { type: "code", content: "// Code snippets dari video\n", language: "javascript" },
    ],
  },
  {
    name: "Blank Canvas",
    description: "Mulai dari kosong, bebas berkreasi",
    icon: "✨",
    blocks: [],
  },
];

export default function DashboardPage() {
  const [user, loading] = useAuthState(auth);
  const [title, setTitle] = useState("");
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const router = useRouter();

  // Confirm modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // Template confirmation modal state
  const [showTemplateConfirm, setShowTemplateConfirm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<BlogTemplate | null>(null);

  // Fungsi untuk Content Blocks
  const generateId = () => Math.random().toString(36).substring(2, 11);

  // Handler untuk memilih template
  const handleTemplateSelect = (template: BlogTemplate) => {
    if (contentBlocks.length > 0) {
      // Jika sudah ada konten, tampilkan modal konfirmasi
      setSelectedTemplate(template);
      setShowTemplateConfirm(true);
    } else {
      // Jika belum ada konten, langsung apply
      applyTemplate(template);
    }
  };

  // Fungsi untuk apply template
  const applyTemplate = (template: BlogTemplate) => {
    const blocksWithIds = template.blocks.map((block) => ({
      ...block,
      id: generateId(),
    }));
    setContentBlocks(blocksWithIds);
    setShowTemplates(false);
    setShowTemplateConfirm(false);
    setSelectedTemplate(null);
    toast.success(`Template "${template.name}" berhasil diterapkan! ✨`);
  };

  // Handler untuk konfirmasi apply template
  const handleConfirmTemplate = () => {
    if (selectedTemplate) {
      applyTemplate(selectedTemplate);
    }
  };

  // Handler untuk cancel template
  const handleCancelTemplate = () => {
    setShowTemplateConfirm(false);
    setSelectedTemplate(null);
  };

  const addContentBlock = (type: ContentBlockType) => {
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      content: "",
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const updateContentBlock = (id: string, content: string) => {
    setContentBlocks(contentBlocks.map((block) => (block.id === id ? { ...block, content } : block)));
  };

  const removeContentBlock = (id: string) => {
    setContentBlocks(contentBlocks.filter((block) => block.id !== id));
    toast.success("Block dihapus");
  };

  const moveContentBlockUp = (index: number) => {
    if (index === 0) return;
    const newBlocks = [...contentBlocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    setContentBlocks(newBlocks);
  };

  const moveContentBlockDown = (index: number) => {
    if (index === contentBlocks.length - 1) return;
    const newBlocks = [...contentBlocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    setContentBlocks(newBlocks);
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return data.secure_url;
  };

  const uploadBlockImage = async (id: string, file: File) => {
    if (file.size > 1 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 1MB");
      return;
    }

    setUploading(true);
    const loadingToast = toast.loading("Mengunggah gambar...");
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      updateContentBlock(id, imageUrl);
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
    } finally {
      setUploading(false);
    }
  };

  const extractYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const isValidYouTubeUrl = (url: string): boolean => {
    return extractYouTubeId(url) !== null;
  };

  // Extract Google Drive file ID
  const extractGoogleDriveId = (url: string): string | null => {
    // Match various Google Drive URL formats
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9_-]+)/, // /file/d/FILE_ID
      /id=([a-zA-Z0-9_-]+)/, // ?id=FILE_ID
      /\/folders\/([a-zA-Z0-9_-]+)/, // /folders/FOLDER_ID
      /\/d\/([a-zA-Z0-9_-]+)/, // /d/FILE_ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const isValidGoogleDriveUrl = (url: string): boolean => {
    return url.includes("drive.google.com") && extractGoogleDriveId(url) !== null;
  };

  const getGoogleDriveEmbedUrl = (url: string): string => {
    const fileId = extractGoogleDriveId(url);
    if (!fileId) return url;
    return `https://drive.google.com/file/d/${fileId}/preview`;
  };

  const getGoogleDriveDownloadUrl = (url: string): string => {
    const fileId = extractGoogleDriveId(url);
    if (!fileId) return url;
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  };

  // Upload file to Cloudinary
  const uploadFileToCloudinary = async (file: File): Promise<{ url: string; fileName: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return {
      url: data.secure_url,
      fileName: file.name,
    };
  };

  const uploadBlockFile = async (id: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB");
      return;
    }

    setUploading(true);
    const loadingToast = toast.loading("Mengunggah file...");
    try {
      const { url, fileName } = await uploadFileToCloudinary(file);
      setContentBlocks(
        contentBlocks.map((block) =>
          block.id === id
            ? {
                ...block,
                content: fileName,
                fileUrl: url,
                fileName: fileName,
              }
            : block
        )
      );
      toast.update(loadingToast, {
        render: "File berhasil diunggah!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.update(loadingToast, {
        render: "Gagal mengunggah file",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setUploading(false);
    }
  };

  // Loading state
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center p-8 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <FiFileText className="text-2xl text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Memuat...</h3>
          <p className="text-gray-400">Mohon tunggu sebentar</p>
        </div>
      </div>
    );

  // Not authenticated
  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center p-8 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiFileText className="text-2xl text-yellow-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Akses Dibatasi</h3>
          <p className="text-gray-400">Silakan login terlebih dahulu untuk mengakses dashboard.</p>
        </div>
      </div>
    );

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Judul blog harus diisi!");
      return;
    }
    if (contentBlocks.length === 0) {
      toast.error("Tambahkan minimal satu konten block!");
      return;
    }

    // Validasi setiap block
    for (const block of contentBlocks) {
      if (!block.content.trim()) {
        toast.error(`Block ${block.type} tidak boleh kosong`);
        return;
      }
      if (block.type === "youtube" && !isValidYouTubeUrl(block.content)) {
        toast.error("URL YouTube tidak valid");
        return;
      }
    }

    // Show confirm modal
    setConfirmAction(() => handleSubmit);
    setShowConfirmModal(true);
  };

  const handleSubmit = async () => {
    setUploading(true);
    const loadingToast = toast.loading("Mempublikasikan blog...");

    try {
      // Ambil username dari Firestore users collection
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      // Check if user is blocked
      if (userData?.blockedUntil) {
        const blockedUntil = userData.blockedUntil.toDate ? userData.blockedUntil.toDate() : new Date(userData.blockedUntil);
        if (blockedUntil > new Date()) {
          const blockedUntilDate = blockedUntil.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
          setUploading(false);
          toast.update(loadingToast, {
            render: `Akun Anda diblokir hingga ${blockedUntilDate}. Anda tidak dapat mempublikasikan blog.`,
            type: "error",
            isLoading: false,
            autoClose: 5000,
          });
          return;
        }
      }

      const githubUsername = userData?.githubUsername || "";
      const existingRole = userSnap.exists() ? userData?.role : "user";

      // Update user data TANPA overwrite role
      await setDoc(
        userRef,
        {
          email: user.email,
          displayName: user.displayName || "Anonim",
          photoURL: user.photoURL || "/default-avatar.png",
          role: existingRole, // ← PERTAHANKAN ROLE YANG SUDAH ADA
          lastLogin: new Date(),
          // Jangan overwrite createdAt jika user sudah ada
          createdAt: userSnap.exists() ? userData?.createdAt : serverTimestamp(),
        },
        { merge: true }
      );

      // Buat blog
      await addDoc(collection(db, "blogs"), {
        title: title.trim(),
        contentBlocks,
        authorName: githubUsername || user.displayName || "Anonim",
        authorAvatar: user.photoURL || "/default-avatar.png",
        authorId: user.uid,
        authorEmail: user.email || "",
        status: "published",
        githubUrl: githubUsername ? `https://github.com/${githubUsername}` : "",
        createdAt: serverTimestamp(),
      });

      setTitle("");
      setContentBlocks([]);

      toast.update(loadingToast, {
        render: "Blog berhasil dipublikasikan! 🎉",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.update(loadingToast, {
        render: "Terjadi kesalahan saat mempublikasikan blog",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          {/* Back Button */}
          <div className="mb-6">
            <button onClick={() => router.push("/")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
              <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                <FiArrowLeft className="text-lg" />
              </div>
              <span className="font-medium">Kembali ke Beranda</span>
            </button>
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-4">Buat Blog Baru</h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Bagikan pengetahuan, pengalaman, dan karya terbaik Anda dengan komunitas</p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* FORM */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <FiFileText className="text-2xl text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Form Publikasi</h2>
                <p className="text-gray-400 text-sm">Isi detail blog Anda</p>
              </div>
            </div>

            <form onSubmit={handleSubmitClick} className="space-y-6">
              <div>
                <label className="block mb-3 text-sm font-medium text-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                    <FiType className="text-blue-400" />
                    Judul Blog
                  </div>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black/30 border border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-500"
                  placeholder="Masukkan judul yang menarik..."
                  maxLength={100}
                />
                <div className="text-right text-xs text-gray-500 mt-1">{title.length}/100 karakter</div>
              </div>

              {/* Template Selector */}
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3">
                  <div className="flex items-center gap-2">
                    <FiLayout className="text-blue-400 text-base sm:text-lg" />
                    <span className="text-xs sm:text-sm font-medium text-blue-300">Template Formasi (Opsional)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="text-xs px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-all text-blue-300 hover:text-blue-200 w-full sm:w-auto"
                  >
                    {showTemplates ? "Tutup" : "Pilih Template"}
                  </button>
                </div>

                <AnimatePresence>
                  {showTemplates && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 mt-3">
                        {blogTemplates.map((template) => (
                          <motion.button
                            key={template.name}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleTemplateSelect(template)}
                            className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-lg transition-all text-left group"
                          >
                            <span className="text-xl sm:text-2xl shrink-0">{template.icon}</span>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">{template.name}</h4>
                              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 sm:line-clamp-1">{template.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-purple-400">{template.blocks.length > 0 ? `${template.blocks.length} blocks` : "Blank canvas"}</span>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-start gap-2 mt-3 text-xs text-gray-400">
                  <span className="shrink-0">💡</span>
                  <p className="leading-relaxed">Template membantu Anda memulai dengan struktur konten yang sudah siap pakai. Pilih salah satu atau mulai dari blank canvas.</p>
                </div>
              </div>

              {/* Content Blocks Section */}
              <div>
                <label className="block mb-3 text-sm font-medium text-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                    <FiFileText className="text-green-400" />
                    Konten Blog
                  </div>
                </label>

                {/* Block List */}
                {contentBlocks.length > 0 && (
                  <div className="space-y-3 mb-4 ">
                    {contentBlocks.map((block, index) => (
                      <div key={block.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                        {/* Block Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {block.type === "subtitle" && <FiType className="text-blue-400" />}
                            {block.type === "text" && <FiFileText className="text-green-400" />}
                            {block.type === "youtube" && <FiYoutube className="text-red-400" />}
                            {block.type === "image" && <FiImage className="text-purple-400" />}
                            {block.type === "code" && <FiCode className="text-orange-400" />}
                            {block.type === "file" && <FiDownload className="text-cyan-400" />}
                            {block.type === "video" && <FiVideo className="text-pink-400" />}
                            <span className="text-sm font-medium capitalize">{block.type === "file" ? "File Download" : block.type === "video" ? "Video (Drive)" : block.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => moveContentBlockUp(index)}
                              disabled={index === 0}
                              className="text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Pindah ke atas"
                            >
                              <FiArrowUp />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveContentBlockDown(index)}
                              disabled={index === contentBlocks.length - 1}
                              className="text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Pindah ke bawah"
                            >
                              <FiArrowDown />
                            </button>
                            <button type="button" onClick={() => removeContentBlock(block.id)} className="text-red-400 hover:text-red-300 transition-colors" title="Hapus block">
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>

                        {/* Block Content */}
                        {block.type === "subtitle" && (
                          <input
                            type="text"
                            value={block.content}
                            onChange={(e) => updateContentBlock(block.id, e.target.value)}
                            placeholder="Masukkan subjudul..."
                            className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            maxLength={200}
                          />
                        )}

                        {block.type === "text" && (
                          <textarea
                            value={block.content}
                            onChange={(e) => updateContentBlock(block.id, e.target.value)}
                            placeholder="Tulis konten..."
                            rows={6}
                            className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all resize-none"
                          />
                        )}

                        {block.type === "youtube" && (
                          <div>
                            <input
                              type="url"
                              value={block.content}
                              onChange={(e) => updateContentBlock(block.id, e.target.value)}
                              placeholder="https://www.youtube.com/watch?v=..."
                              className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                            />
                            {block.content && isValidYouTubeUrl(block.content) && (
                              <div className="mt-2 rounded-lg overflow-hidden">
                                <YoutubeEmbed url={block.content} />
                              </div>
                            )}
                            {block.content && !isValidYouTubeUrl(block.content) && <p className="text-xs text-red-400 mt-1">URL YouTube tidak valid</p>}
                          </div>
                        )}

                        {block.type === "image" && (
                          <div>
                            {!block.content ? (
                              <label className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-4 py-3 rounded-lg cursor-pointer transition-all">
                                <FiImage />
                                <span>Pilih Gambar</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      if (file.size > 1 * 1024 * 1024) {
                                        toast.error("File melebihi ukuran maksimal 1MB");
                                        return;
                                      }
                                      uploadBlockImage(block.id, file);
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            ) : (
                              <div className="relative group rounded-lg overflow-hidden">
                                <img src={block.content} alt="Block" className="w-full h-48 object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <label className="bg-blue-500 hover:bg-blue-600 p-2 rounded-full transition-colors cursor-pointer">
                                    <FiEdit2 className="text-white" />
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          if (file.size > 1 * 1024 * 1024) {
                                            toast.error("File melebihi ukuran maksimal 1MB");
                                            return;
                                          }
                                          uploadBlockImage(block.id, file);
                                        }
                                      }}
                                      className="hidden"
                                    />
                                  </label>
                                  <button type="button" onClick={() => updateContentBlock(block.id, "")} className="bg-red-500 hover:bg-red-600 p-2 rounded-full transition-colors">
                                    <FiX className="text-white" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {block.type === "code" && (
                          <div className="space-y-2">
                            <select
                              value={block.language || "javascript"}
                              onChange={(e) => {
                                const newBlocks = contentBlocks.map((b) => (b.id === block.id ? { ...b, language: e.target.value } : b));
                                setContentBlocks(newBlocks);
                              }}
                              className="w-full bg-black/80 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-white"
                              style={{ backgroundColor: "#0a0a0a" }}
                            >
                              <option value="javascript" style={{ backgroundColor: "#0a0a0a", color: "#fff" }}>
                                JavaScript
                              </option>
                              <option value="typescript" style={{ backgroundColor: "#0a0a0a", color: "#fff" }}>
                                TypeScript
                              </option>
                              <option value="python" style={{ backgroundColor: "#0a0a0a", color: "#fff" }}>
                                Python
                              </option>
                              <option value="java" style={{ backgroundColor: "#0a0a0a", color: "#fff" }}>
                                Java
                              </option>
                              <option value="cpp" style={{ backgroundColor: "#0a0a0a", color: "#fff" }}>
                                C++
                              </option>
                              <option value="csharp" style={{ backgroundColor: "#0a0a0a", color: "#fff" }}>
                                C#
                              </option>
                              <option value="html" style={{ backgroundColor: "#0a0a0a", color: "#fff" }}>
                                HTML
                              </option>
                              <option value="css" style={{ backgroundColor: "#0a0a0a", color: "#fff" }}>
                                CSS
                              </option>
                              <option value="sql" style={{ backgroundColor: "#0a0a0a", color: "#fff" }}>
                                SQL
                              </option>
                              <option value="bash" style={{ backgroundColor: "#0a0a0a", color: "#fff" }}>
                                Bash
                              </option>
                              <option value="json" style={{ backgroundColor: "#0a0a0a", color: "#fff" }}>
                                JSON
                              </option>
                              <option value="xml" style={{ backgroundColor: "#0a0a0a", color: "#fff" }}>
                                XML
                              </option>
                            </select>
                            <textarea
                              value={block.content}
                              onChange={(e) => updateContentBlock(block.id, e.target.value)}
                              placeholder="Paste kode Anda di sini..."
                              rows={10}
                              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none font-mono text-sm text-gray-100"
                              style={{ backgroundColor: "#0a0a0a" }}
                              spellCheck={false}
                            />
                            {block.content && (
                              <div className="text-xs text-gray-400">
                                {block.content.split("\n").length} baris, {block.content.length} karakter
                              </div>
                            )}
                          </div>
                        )}

                        {/* File Download Block */}
                        {block.type === "file" && (
                          <div className="space-y-3">
                            <div className="text-sm text-gray-400 mb-2">Upload file atau masukkan link download</div>

                            {!block.fileUrl ? (
                              <div className="space-y-3">
                                {/* File Upload */}
                                <label className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-4 py-3 rounded-lg cursor-pointer transition-all">
                                  <FiUpload />
                                  <span>Upload File (Max 10MB)</span>
                                  <input
                                    type="file"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        uploadBlockFile(block.id, file);
                                      }
                                    }}
                                    className="hidden"
                                  />
                                </label>

                                <div className="text-center text-xs text-gray-500">atau</div>

                                {/* Manual Link Input */}
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={block.fileName || ""}
                                    onChange={(e) => {
                                      const newBlocks = contentBlocks.map((b) => (b.id === block.id ? { ...b, fileName: e.target.value } : b));
                                      setContentBlocks(newBlocks);
                                    }}
                                    placeholder="Nama file (contoh: Tutorial.pdf)"
                                    className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                  />
                                  <input
                                    type="url"
                                    value={block.content}
                                    onChange={(e) => updateContentBlock(block.id, e.target.value)}
                                    placeholder="Link download (Google Drive, Dropbox, dll)"
                                    className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                  />
                                  {block.content && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newBlocks = contentBlocks.map((b) => (b.id === block.id ? { ...b, fileUrl: b.content } : b));
                                        setContentBlocks(newBlocks);
                                        toast.success("Link download ditambahkan!");
                                      }}
                                      className="w-full bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg transition-all"
                                    >
                                      Simpan Link
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    <FiDownload className="text-blue-400 text-xl" />
                                    <div>
                                      <p className="text-sm font-medium text-white">{block.fileName || block.content}</p>
                                      <a href={block.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 break-all">
                                        {block.fileUrl}
                                      </a>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newBlocks = contentBlocks.map((b) => (b.id === block.id ? { ...b, fileUrl: undefined, content: "", fileName: "" } : b));
                                      setContentBlocks(newBlocks);
                                    }}
                                    className="bg-red-500 hover:bg-red-600 p-2 rounded-full transition-colors ml-2"
                                  >
                                    <FiX className="text-white" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Video Block (Google Drive) */}
                        {block.type === "video" && (
                          <div className="space-y-3">
                            <div className="text-sm text-gray-400 mb-2">Masukkan link Google Drive video</div>
                            <input
                              type="url"
                              value={block.content}
                              onChange={(e) => updateContentBlock(block.id, e.target.value)}
                              placeholder="https://drive.google.com/file/d/..."
                              className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                            />
                            {block.content && isValidGoogleDriveUrl(block.content) && (
                              <div className="mt-3 bg-black/30 rounded-lg overflow-hidden border border-purple-500/30">
                                <iframe src={getGoogleDriveEmbedUrl(block.content)} className="w-full aspect-video" allow="autoplay" allowFullScreen></iframe>
                              </div>
                            )}
                            {block.content && !isValidGoogleDriveUrl(block.content) && <div className="text-xs text-yellow-400 mt-2">⚠️ URL Google Drive tidak valid</div>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Block Button */}
                <button
                  type="button"
                  onClick={() => setShowBlockModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-4 py-3 rounded-xl font-medium transition-all shadow-lg"
                >
                  <FiPlus className="text-lg" />
                  <span>Tambah Konten Blog</span>
                </button>
              </div>

              <div className="pt-6 border-t border-gray-700">
                <button
                  type="submit"
                  disabled={uploading || !title.trim()}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-blue-500/25 disabled:shadow-none"
                >
                  <FiUpload className="text-lg" />
                  {uploading ? "Mempublikasikan..." : "Publikasikan Blog"}
                </button>
              </div>
            </form>
          </motion.div>

          {/* PREVIEW */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl h-fit lg:sticky lg:top-8 "
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-green-500/20 rounded-lg">
                <FiEye className="text-xl sm:text-2xl text-green-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">Preview Blog</h2>
                <p className="text-gray-400 text-xs sm:text-sm">Tampilan blog Anda</p>
              </div>
            </div>

            {title || contentBlocks.length > 0 ? (
              <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                {/* TITLE SECTION */}
                {title && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-black/20 rounded-lg sm:rounded-xl border border-white/5 p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center gap-2 text-xs text-blue-400 mb-2 sm:mb-3">
                      <FiType className="text-sm" />
                      <span className="font-medium">Judul</span>
                    </div>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-3 leading-tight">{title}</h3>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 flex-wrap">
                      <img src={user.photoURL || "/default-avatar.png"} alt="Author" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full" />
                      <span className="truncate max-w-[120px] sm:max-w-none">{user.displayName || "Anonim"}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="text-xs hidden sm:inline">{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                    </div>
                  </motion.div>
                )}

                {/* CONTENT BLOCKS */}
                {contentBlocks.map((block, index) => (
                  <motion.div key={block.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * (index + 1) }} className="bg-black/20 rounded-lg sm:rounded-xl border border-white/5 p-3 sm:p-4 lg:p-6">
                    {block.type === "subtitle" && block.content && (
                      <>
                        <div className="flex items-center gap-2 text-xs text-blue-400 mb-2 sm:mb-3">
                          <FiType className="text-sm" />
                          <span className="font-medium">Subjudul</span>
                        </div>
                        <h4 className="text-base sm:text-lg lg:text-xl font-semibold text-white">{block.content}</h4>
                      </>
                    )}

                    {block.type === "text" && block.content && (
                      <>
                        <div className="flex items-center gap-2 text-xs text-green-400 mb-2 sm:mb-3">
                          <FiFileText className="text-sm" />
                          <span className="font-medium">Konten</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-line">{block.content}</p>
                      </>
                    )}

                    {block.type === "youtube" && block.content && isValidYouTubeUrl(block.content) && (
                      <>
                        <div className="flex items-center gap-2 text-xs text-red-400 mb-2 sm:mb-3 lg:mb-4">
                          <FiYoutube className="text-sm" />
                          <span className="font-medium">Video YouTube</span>
                        </div>
                        <div className="rounded-lg overflow-hidden">
                          <YoutubeEmbed url={block.content} />
                        </div>
                      </>
                    )}

                    {block.type === "image" && block.content && (
                      <>
                        <div className="flex items-center gap-2 text-xs text-purple-400 mb-2 sm:mb-3 lg:mb-4">
                          <FiImage className="text-sm" />
                          <span className="font-medium">Gambar</span>
                        </div>
                        <div className="rounded-lg overflow-hidden">
                          <img src={block.content} alt="Block" className="w-full h-auto object-cover" />
                        </div>
                      </>
                    )}

                    {block.type === "code" && block.content && (
                      <>
                        <div className="flex items-center gap-2 text-xs text-orange-400 mb-2 sm:mb-3 lg:mb-4">
                          <FiCode className="text-sm" />
                          <span className="font-medium">Kode ({block.language || "javascript"})</span>
                        </div>
                        <div className="rounded-lg overflow-hidden bg-black/40 border border-gray-700">
                          <pre className="p-2 sm:p-3 lg:p-4 overflow-x-auto">
                            <code className="text-xs sm:text-sm font-mono text-gray-300">{block.content}</code>
                          </pre>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 lg:py-16">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <FiFileText className="text-xl sm:text-2xl text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-300 mb-2">Preview Belum Tersedia</h3>
                <p className="text-gray-500 text-xs sm:text-sm max-w-xs mx-auto px-4">Mulai menulis di form sebelah kiri untuk melihat preview blog di sini</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction || (() => {})}
        title="Publikasikan Blog?"
        message="Apakah Anda yakin ingin mempublikasikan blog ini? Blog akan langsung terlihat oleh semua pengguna."
        confirmText="Publikasikan"
        cancelText="Batal"
        type="success"
      />

      {/* Template Confirmation Modal */}
      <AnimatePresence>
        {showTemplateConfirm && selectedTemplate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleCancelTemplate}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-gray-900 to-black border border-purple-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-2xl">{selectedTemplate.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Terapkan Template?</h3>
                  <p className="text-gray-400 text-sm">Konten yang ada akan diganti</p>
                </div>
              </div>

              {/* Content */}
              <div className="mb-6">
                <p className="text-gray-300 mb-3">Anda akan menerapkan template:</p>
                <div className="bg-white/5 p-4 rounded-lg border border-purple-500/30">
                  <h4 className="text-white font-medium mb-1">{selectedTemplate.name}</h4>
                  <p className="text-gray-400 text-sm mb-2">{selectedTemplate.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-md">{selectedTemplate.blocks.length > 0 ? `${selectedTemplate.blocks.length} content blocks` : "Blank canvas"}</span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <p className="text-orange-300 text-sm flex items-start gap-2">
                    <span className="flex-shrink-0">⚠️</span>
                    <span>Konten yang sudah Anda buat ({contentBlocks.length} blocks) akan dihapus dan diganti dengan template ini.</span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={handleCancelTemplate} className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 rounded-xl font-medium transition-all">
                  Batal
                </button>
                <button
                  onClick={handleConfirmTemplate}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                >
                  <FiLayout className="text-sm" />
                  Ya, Terapkan
                </button>
              </div>
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
                    <p className="text-xs text-gray-400">Upload gambar (Max 1MB)</p>
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
