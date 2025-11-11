// app/dashboard/page.tsx - CUSTOM GRID LAYOUT
"use client";

import { useState, useMemo } from "react";
import { db, auth } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp, doc, setDoc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion, AnimatePresence } from "framer-motion";
import { FiImage, FiUpload, FiX, FiFileText, FiType, FiYoutube, FiPlus, FiMove, FiMaximize2, FiArrowLeft, FiEdit2, FiCheck } from "react-icons/fi";
import { useRouter } from "next/navigation";
import GridLayout, { Layout } from "react-grid-layout";
import { toast } from "react-toastify";
import ConfirmModal from "@/components/ConfirmModal";

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

export default function DashboardPage() {
  const [user, loading] = useAuthState(auth);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [youtubeUrls, setYoutubeUrls] = useState<string[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isAddingYoutube, setIsAddingYoutube] = useState(false);
  const [youtubeInput, setYoutubeInput] = useState("");
  const router = useRouter();

  // State untuk edit YouTube URL
  const [editingYoutubeIndex, setEditingYoutubeIndex] = useState<number | null>(null);
  const [editYoutubeInput, setEditYoutubeInput] = useState("");

  // State untuk edit/replace gambar
  const [replacingImageIndex, setReplacingImageIndex] = useState<number | null>(null);

  // Confirm modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // State untuk grid layout - posisi bebas untuk setiap konten
  const [layout, setLayout] = useState<Layout[]>([
    { i: "title", x: 0, y: 0, w: 6, h: 2 }, // Judul di atas, full width
    { i: "content", x: 0, y: 2, w: 4, h: 4 }, // Konten di kiri
    { i: "youtube", x: 4, y: 2, w: 2, h: 4 }, // YouTube di kanan
    { i: "images", x: 0, y: 6, w: 6, h: 5 }, // Images di bawah (lebih tinggi)
  ]);

  // Handle layout change
  const handleLayoutChange = (newLayout: Layout[]) => {
    setLayout(newLayout);
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

  // Fungsi untuk extract YouTube ID
  const extractYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Validasi URL YouTube
  const isValidYouTubeUrl = (url: string): boolean => {
    return extractYouTubeId(url) !== null;
  };

  // Tambah URL YouTube
  const addYouTubeUrl = () => {
    const trimmedUrl = youtubeInput.trim();

    if (!trimmedUrl) {
      toast.error("URL YouTube tidak boleh kosong");
      return;
    }

    if (!isValidYouTubeUrl(trimmedUrl)) {
      toast.error("URL YouTube tidak valid. Pastikan URL berasal dari YouTube.");
      return;
    }

    if (youtubeUrls.includes(trimmedUrl)) {
      toast.warning("URL YouTube ini sudah ditambahkan");
      return;
    }

    if (youtubeUrls.length >= 3) {
      toast.warning("Maksimal 3 video YouTube yang dapat ditambahkan");
      return;
    }

    setYoutubeUrls([...youtubeUrls, trimmedUrl]);
    setYoutubeInput("");
    setIsAddingYoutube(false);
    toast.success("Video YouTube berhasil ditambahkan!");
  };

  // Hapus URL YouTube
  const removeYouTubeUrl = (index: number) => {
    const newUrls = youtubeUrls.filter((_, i) => i !== index);
    setYoutubeUrls(newUrls);
  };

  // Edit URL YouTube
  const startEditYouTubeUrl = (index: number) => {
    setEditingYoutubeIndex(index);
    setEditYoutubeInput(youtubeUrls[index]);
  };

  const saveEditYouTubeUrl = () => {
    if (editingYoutubeIndex === null) return;

    const trimmedUrl = editYoutubeInput.trim();

    if (!trimmedUrl) {
      toast.error("URL YouTube tidak boleh kosong");
      return;
    }

    if (!isValidYouTubeUrl(trimmedUrl)) {
      toast.error("URL YouTube tidak valid. Pastikan URL berasal dari YouTube.");
      return;
    }

    // Check jika URL sudah ada di list (kecuali URL yang sedang diedit)
    if (youtubeUrls.some((url, idx) => idx !== editingYoutubeIndex && url === trimmedUrl)) {
      toast.warning("URL YouTube ini sudah ditambahkan");
      return;
    }

    const newUrls = [...youtubeUrls];
    newUrls[editingYoutubeIndex] = trimmedUrl;
    setYoutubeUrls(newUrls);
    setEditingYoutubeIndex(null);
    setEditYoutubeInput("");
    toast.success("URL YouTube berhasil diperbarui!");
  };

  const cancelEditYouTubeUrl = () => {
    setEditingYoutubeIndex(null);
    setEditYoutubeInput("");
  };

  const uploadImagesToCloudinary = async () => {
    const uploadedUrls: string[] = [];
    for (const file of images) {
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

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Judul blog harus diisi!");
      return;
    }
    if (!content.trim()) {
      toast.error("Konten blog harus diisi!");
      return;
    }

    // Show confirm modal
    setConfirmAction(() => handleSubmit);
    setShowConfirmModal(true);
  };

  const handleSubmit = async () => {
    setUploading(true);
    const loadingToast = toast.loading("Mempublikasikan blog...");

    try {
      const imageUrls = images.length > 0 ? await uploadImagesToCloudinary() : [];
      const githubProfile = user.providerData.find((p) => p.providerId === "github.com");
      const githubUsername = githubProfile?.uid || githubProfile?.displayName || user.displayName || "";

      // FIX: Jangan overwrite role user yang sudah ada
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const existingRole = userSnap.exists() ? userSnap.data().role : "user";

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
          createdAt: userSnap.exists() ? userSnap.data().createdAt : serverTimestamp(),
        },
        { merge: true }
      );

      // Buat blog
      await addDoc(collection(db, "blogs"), {
        title: title.trim(),
        content: content.trim(),
        images: imageUrls,
        youtubeUrls: youtubeUrls,
        authorName: user.displayName || "Anonim",
        authorAvatar: user.photoURL || "/default-avatar.png",
        authorId: user.uid,
        authorEmail: user.email || "",
        status: "published",
        githubUrl: githubUsername ? `https://github.com/${githubUsername}` : "",
        createdAt: serverTimestamp(),
      });

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    // Validasi jumlah file
    if (images.length + files.length > 6) {
      toast.warning("Maksimal 6 gambar yang dapat diunggah");
      return;
    }

    // Validasi ukuran file (max 5MB)
    const oversizedFiles = files.filter((file) => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error("Beberapa file melebihi ukuran maksimal 5MB");
      return;
    }

    setImages((prev) => [...prev, ...files]);
    setPreviewUrls((prev) => [...prev, ...files.map((file) => URL.createObjectURL(file))]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Replace/Edit gambar
  const handleReplaceImage = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    
    // Validasi ukuran file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File melebihi ukuran maksimal 5MB");
      return;
    }

    // Replace gambar dan preview URL
    const newImages = [...images];
    const newPreviewUrls = [...previewUrls];
    
    newImages[index] = file;
    newPreviewUrls[index] = URL.createObjectURL(file);
    
    setImages(newImages);
    setPreviewUrls(newPreviewUrls);
    setReplacingImageIndex(null);
    toast.success("Gambar berhasil diganti!");
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

              <div>
                <label className="block mb-3 text-sm font-medium text-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                    <FiFileText className="text-green-400" />
                    Konten Blog
                  </div>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="w-full bg-black/30 border border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-500 resize-none"
                  placeholder="Tulis konten blog Anda di sini..."
                  maxLength={5000}
                />
                <div className="text-right text-xs text-gray-500 mt-1">{content.length}/5000 karakter</div>
              </div>

              {/* YouTube Section */}
              <div>
                <label className="block mb-3 text-sm font-medium text-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                    <FiYoutube className="text-red-500" />
                    Video YouTube
                    <span className="text-xs text-gray-500">(Opsional, maks. 3 video)</span>
                  </div>
                </label>

                {!isAddingYoutube && youtubeUrls.length < 3 && (
                  <button
                    type="button"
                    onClick={() => setIsAddingYoutube(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-4 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-red-500/25 mb-4"
                  >
                    <FiYoutube className="text-lg" />
                    <span>Tambah Video YouTube</span>
                    <FiPlus className="text-lg" />
                  </button>
                )}

                {isAddingYoutube && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Masukkan URL YouTube</label>
                      <input
                        type="url"
                        value={youtubeInput}
                        onChange={(e) => setYoutubeInput(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all placeholder-gray-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">Contoh: https://youtube.com/watch?v=VIDEO_ID atau https://youtu.be/VIDEO_ID</p>
                    </div>

                    <div className="flex gap-2">
                      <button type="button" onClick={addYouTubeUrl} className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-medium transition-colors">
                        Tambah
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingYoutube(false);
                          setYoutubeInput("");
                        }}
                        className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {/* YouTube URLs List */}
                {youtubeUrls.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <FiYoutube className="text-red-500" />
                      Video YouTube ({youtubeUrls.length}/3)
                    </h4>

                    <div className="grid gap-3">
                      {youtubeUrls.map((url, index) => {
                        const videoId = extractYouTubeId(url);
                        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                        const isEditing = editingYoutubeIndex === index;

                        return (
                          <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-3">
                            {isEditing ? (
                              // Edit Mode
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-300 mb-2">Edit URL YouTube</label>
                                  <input
                                    type="url"
                                    value={editYoutubeInput}
                                    onChange={(e) => setEditYoutubeInput(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="w-full bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all placeholder-gray-500"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={saveEditYouTubeUrl}
                                    className="flex items-center gap-1 bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                  >
                                    <FiCheck className="text-sm" />
                                    Simpan
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditYouTubeUrl}
                                    className="bg-gray-500 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                  >
                                    Batal
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // Display Mode
                              <div className="flex items-center gap-3 group">
                                {/* Thumbnail */}
                                <div className="flex-shrink-0 w-20 h-12 bg-gray-700 rounded overflow-hidden relative">
                                  {videoId ? (
                                    <img src={thumbnailUrl} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                                      <FiYoutube className="text-gray-400" />
                                    </div>
                                  )}
                                </div>

                                {/* URL Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-white truncate">Video {index + 1}</p>
                                  <p className="text-xs text-gray-400 truncate">{url}</p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => startEditYouTubeUrl(index)}
                                    className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                                    title="Edit video"
                                  >
                                    <FiEdit2 className="text-lg" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeYouTubeUrl(index)}
                                    className="text-red-400 hover:text-red-300 transition-colors p-1"
                                    title="Hapus video"
                                  >
                                    <FiX className="text-lg" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {youtubeUrls.length >= 3 && <p className="text-xs text-yellow-400 text-center">Maksimal 3 video YouTube telah tercapai</p>}
                  </div>
                )}
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block mb-3 text-sm font-medium text-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                    <FiImage className="text-purple-400" />
                    Gambar Pendukung
                    <span className="text-xs text-gray-500">(Opsional, maks. 6 file)</span>
                  </div>
                </label>

                <div className="flex items-center gap-3 mb-4">
                  <label className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-5 py-3 rounded-xl cursor-pointer transition-all shadow-lg hover:shadow-purple-500/25">
                    <FiImage className="text-lg" />
                    <span>Pilih Gambar</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                  </label>

                  {images.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setImages([]);
                        setPreviewUrls([]);
                      }}
                      className="text-sm text-red-400 hover:text-red-300 underline transition-colors"
                    >
                      Hapus semua
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {previewUrls.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                      {previewUrls.map((url, i) => (
                        <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="relative group rounded-xl overflow-hidden border border-gray-600 bg-black/20">
                          <img src={url} alt={`preview-${i}`} className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {/* Replace Button */}
                            <label className="bg-blue-500 hover:bg-blue-600 p-2 rounded-full transition-colors cursor-pointer" title="Ganti gambar">
                              <FiEdit2 className="text-white text-sm" />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleReplaceImage(i, e)}
                                className="hidden"
                              />
                            </label>
                            {/* Remove Button */}
                            <button type="button" onClick={() => handleRemoveImage(i)} className="bg-red-500 hover:bg-red-600 p-2 rounded-full transition-colors" title="Hapus gambar">
                              <FiX className="text-white text-sm" />
                            </button>
                          </div>
                          <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs truncate max-w-[calc(100%-1rem)]">{images[i]?.name}</div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-6 border-t border-gray-700">
                <button
                  type="submit"
                  disabled={uploading || !title.trim() || !content.trim()}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-blue-500/25 disabled:shadow-none"
                >
                  <FiUpload className="text-lg" />
                  {uploading ? "Mempublikasikan..." : "Publikasikan Blog"}
                </button>
              </div>
            </form>
          </motion.div>

          {/* PREVIEW WITH CUSTOM GRID LAYOUT */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-2xl h-fit sticky top-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <FiMaximize2 className="text-2xl text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Preview Blog</h2>
                <p className="text-gray-400 text-sm">Drag & resize untuk atur posisi bebas</p>
              </div>
            </div>

            {title || content || previewUrls.length > 0 || youtubeUrls.length > 0 ? (
              <div className="relative">
                <GridLayout className="layout" layout={layout} cols={6} rowHeight={60} width={600} onLayoutChange={handleLayoutChange} draggableHandle=".drag-handle" compactType={null} preventCollision={true}>
                  {/* TITLE BLOCK */}
                  <div key="title" className="bg-black/20 rounded-lg border border-white/5 overflow-hidden">
                    <div className="drag-handle bg-blue-500/10 px-3 py-2 cursor-move border-b border-white/5 flex items-center gap-2">
                      <FiMove className="text-sm text-blue-400" />
                      <span className="text-xs font-medium text-blue-400">Judul</span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-xl font-bold text-white mb-2 leading-tight line-clamp-2">{title || "Judul Blog Anda"}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <img src={user.photoURL || "/default-avatar.png"} alt="Author" className="w-5 h-5 rounded-full" />
                        <span className="truncate">{user.displayName || "Anonim"}</span>
                        <span>•</span>
                        <span>{new Date().toLocaleDateString("id-ID", { month: "short", day: "numeric" })}</span>
                      </div>
                    </div>
                  </div>

                  {/* CONTENT BLOCK */}
                  <div key="content" className="bg-black/20 rounded-lg border border-white/5 overflow-hidden">
                    <div className="drag-handle bg-green-500/10 px-3 py-2 cursor-move border-b border-white/5 flex items-center gap-2">
                      <FiMove className="text-sm text-green-400" />
                      <span className="text-xs font-medium text-green-400">Deskripsi</span>
                    </div>
                    <div className="p-4 overflow-auto h-[calc(100%-40px)]">
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line line-clamp-6">{content || "Konten blog Anda akan muncul di sini..."}</p>
                    </div>
                  </div>

                  {/* YOUTUBE BLOCK */}
                  {youtubeUrls.length > 0 && (
                    <div key="youtube" className="bg-black/20 rounded-lg border border-white/5 overflow-hidden">
                      <div className="drag-handle bg-red-500/10 px-3 py-2 cursor-move border-b border-white/5 flex items-center gap-2">
                        <FiMove className="text-sm text-red-400" />
                        <span className="text-xs font-medium text-red-400">Video YouTube ({youtubeUrls.length})</span>
                      </div>
                      <div className="p-4 overflow-auto h-[calc(100%-40px)] space-y-3">
                        {youtubeUrls.slice(0, 2).map((url, index) => {
                          const videoId = extractYouTubeId(url);
                          const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

                          return (
                            <div key={index} className="relative aspect-video bg-black rounded overflow-hidden border border-gray-700">
                              <img src={thumbnailUrl} alt={`YouTube ${index + 1}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                                  <FiYoutube className="text-white text-lg" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* IMAGES BLOCK */}
                  {previewUrls.length > 0 && (
                    <div key="images" className="bg-black/20 rounded-lg border border-white/5 overflow-hidden">
                      <div className="drag-handle bg-purple-500/10 px-3 py-2 cursor-move border-b border-white/5 flex items-center gap-2">
                        <FiMove className="text-sm text-purple-400" />
                        <span className="text-xs font-medium text-purple-400">Gambar ({previewUrls.length})</span>
                      </div>
                      <div className="p-3 overflow-auto h-[calc(100%-40px)]">
                        {previewUrls.length === 1 ? (
                          // Single image - full size
                          <img src={previewUrls[0]} alt="preview" className="rounded border border-gray-700 w-full h-full object-cover" />
                        ) : previewUrls.length === 2 ? (
                          // Two images - side by side
                          <div className="grid grid-cols-2 gap-3 h-full">
                            {previewUrls.map((url, i) => (
                              <img key={i} src={url} alt={`preview-${i}`} className="rounded border border-gray-700 w-full h-full object-cover" />
                            ))}
                          </div>
                        ) : previewUrls.length === 3 ? (
                          // Three images - 2 top, 1 bottom
                          <div className="grid grid-rows-2 gap-3 h-full">
                            <div className="grid grid-cols-2 gap-3">
                              {previewUrls.slice(0, 2).map((url, i) => (
                                <img key={i} src={url} alt={`preview-${i}`} className="rounded border border-gray-700 w-full h-full object-cover" />
                              ))}
                            </div>
                            <img src={previewUrls[2]} alt="preview-2" className="rounded border border-gray-700 w-full h-full object-cover" />
                          </div>
                        ) : (
                          // Multiple images - grid layout
                          <div className="grid grid-cols-2 gap-3 auto-rows-fr h-full">
                            {previewUrls.slice(0, 6).map((url, i) => (
                              <img key={i} src={url} alt={`preview-${i}`} className="rounded border border-gray-700 w-full h-full min-h-[120px] object-cover" />
                            ))}
                          </div>
                        )}
                        {previewUrls.length > 6 && <p className="text-xs text-gray-500 mt-2 text-center">+{previewUrls.length - 6} lainnya</p>}
                      </div>
                    </div>
                  )}
                </GridLayout>

                {/* Info */}
                <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-xs text-blue-300 flex items-center gap-2">
                    <FiMaximize2 className="text-sm" />
                    <span>Drag header untuk pindah posisi • Drag sudut kanan bawah untuk resize</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiFileText className="text-2xl text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">Preview Belum Tersedia</h3>
                <p className="text-gray-500 text-sm">Mulai menulis di form sebelah kiri untuk melihat preview blog di sini</p>
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
    </main>
  );
}
