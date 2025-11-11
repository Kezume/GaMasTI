// app/dashboard/page.tsx
"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp, doc, setDoc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion } from "framer-motion";
import { FiImage, FiUpload, FiX, FiFileText, FiType, FiYoutube, FiArrowLeft, FiEye, FiTrash2, FiArrowUp, FiArrowDown, FiEdit2, FiCode } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ConfirmModal from "@/components/ConfirmModal";
import YoutubeEmbed from "@/components/YoutubeEmbed";

// Interface untuk Content Blocks
type ContentBlockType = "subtitle" | "text" | "youtube" | "image" | "code";

interface ContentBlock {
  id: string;
  type: ContentBlockType;
  content: string;
  language?: string;
}

export default function DashboardPage() {
  const [user, loading] = useAuthState(auth);
  const [title, setTitle] = useState("");
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  // Confirm modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // Fungsi untuk Content Blocks
  const generateId = () => Math.random().toString(36).substring(2, 11);

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
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 5MB");
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
        authorName: user.displayName || "Anonim",
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
                  <div className="space-y-3 mb-4">
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
                            <span className="text-sm font-medium capitalize">{block.type}</span>
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
                              <label className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-4 py-3 rounded-lg cursor-pointer transition-all">
                                <FiImage />
                                <span>Pilih Gambar</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      if (file.size > 5 * 1024 * 1024) {
                                        toast.error("File melebihi ukuran maksimal 5MB");
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
                                          if (file.size > 5 * 1024 * 1024) {
                                            toast.error("File melebihi ukuran maksimal 5MB");
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
                              className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
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
                              className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none font-mono text-sm"
                              spellCheck={false}
                            />
                            {block.content && (
                              <div className="text-xs text-gray-400">
                                {block.content.split("\n").length} baris, {block.content.length} karakter
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Block Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button type="button" onClick={() => addContentBlock("subtitle")} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition-all">
                    <FiType />
                    <span className="text-sm">Subjudul</span>
                  </button>
                  <button type="button" onClick={() => addContentBlock("text")} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg transition-all">
                    <FiFileText />
                    <span className="text-sm">Teks</span>
                  </button>
                  <button type="button" onClick={() => addContentBlock("youtube")} className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg transition-all">
                    <FiYoutube />
                    <span className="text-sm">YouTube</span>
                  </button>
                  <button type="button" onClick={() => addContentBlock("image")} className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg transition-all">
                    <FiImage />
                    <span className="text-sm">Gambar</span>
                  </button>
                  <button type="button" onClick={() => addContentBlock("code")} className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 px-4 py-3 rounded-lg transition-all">
                    <FiCode />
                    <span className="text-sm">Kode</span>
                  </button>
                </div>
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
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-2xl h-fit sticky top-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <FiEye className="text-2xl text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Preview Blog</h2>
                <p className="text-gray-400 text-sm">Tampilan blog Anda</p>
              </div>
            </div>

            {title || contentBlocks.length > 0 ? (
              <div className="space-y-6">
                {/* TITLE SECTION */}
                {title && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-black/20 rounded-xl border border-white/5 p-6">
                    <div className="flex items-center gap-2 text-xs text-blue-400 mb-3">
                      <FiType className="text-sm" />
                      <span className="font-medium">Judul</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3 leading-tight">{title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <img src={user.photoURL || "/default-avatar.png"} alt="Author" className="w-6 h-6 rounded-full" />
                      <span className="truncate">{user.displayName || "Anonim"}</span>
                      <span>•</span>
                      <span>{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                    </div>
                  </motion.div>
                )}

                {/* CONTENT BLOCKS */}
                {contentBlocks.map((block, index) => (
                  <motion.div key={block.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * (index + 1) }} className="bg-black/20 rounded-xl border border-white/5 p-6">
                    {block.type === "subtitle" && block.content && (
                      <>
                        <div className="flex items-center gap-2 text-xs text-blue-400 mb-3">
                          <FiType className="text-sm" />
                          <span className="font-medium">Subjudul</span>
                        </div>
                        <h4 className="text-xl font-semibold text-white">{block.content}</h4>
                      </>
                    )}

                    {block.type === "text" && block.content && (
                      <>
                        <div className="flex items-center gap-2 text-xs text-green-400 mb-3">
                          <FiFileText className="text-sm" />
                          <span className="font-medium">Konten</span>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{block.content}</p>
                      </>
                    )}

                    {block.type === "youtube" && block.content && isValidYouTubeUrl(block.content) && (
                      <>
                        <div className="flex items-center gap-2 text-xs text-red-400 mb-4">
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
                        <div className="flex items-center gap-2 text-xs text-purple-400 mb-4">
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
                        <div className="flex items-center gap-2 text-xs text-orange-400 mb-4">
                          <FiCode className="text-sm" />
                          <span className="font-medium">Kode ({block.language || "javascript"})</span>
                        </div>
                        <div className="rounded-lg overflow-hidden bg-black/40 border border-gray-700">
                          <pre className="p-4 overflow-x-auto">
                            <code className="text-sm font-mono text-gray-300">{block.content}</code>
                          </pre>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiFileText className="text-2xl text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">Preview Belum Tersedia</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">Mulai menulis di form sebelah kiri untuk melihat preview blog di sini</p>
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
