"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion, AnimatePresence } from "framer-motion";
import { FiImage, FiUpload, FiX, FiFileText, FiType } from "react-icons/fi";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [user] = useAuthState(auth);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center p-8 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiFileText className="text-2xl text-yellow-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Akses Dibatasi
          </h3>
          <p className="text-gray-400">
            Silakan login terlebih dahulu untuk mengakses dashboard.
          </p>
        </div>
      </div>
    );

  const uploadImagesToCloudinary = async () => {
    const uploadedUrls: string[] = [];
    for (const file of images) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
      );

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert("Judul blog harus diisi!");
    if (!content.trim()) return alert("Konten blog harus diisi!");

    setUploading(true);
    try {
      const imageUrls =
        images.length > 0 ? await uploadImagesToCloudinary() : [];
      const githubProfile = user.providerData.find(
        (p) => p.providerId === "github.com"
      );
      const githubUsername =
        githubProfile?.uid ||
        githubProfile?.displayName ||
        user.displayName ||
        "";

      // Di dalam handleSubmit function, sebelum addDoc
    //   console.log("=== DEBUG DASHBOARD ===");
    //   console.log("User object:", user);
    //   console.log("User UID:", user?.uid);
    //   console.log("User Email:", user?.email);
    //   console.log("User Display Name:", user?.displayName);
    //   console.log("User Photo URL:", user?.photoURL);

    //   console.log("GitHub Profile:", githubProfile);
    //   console.log("GitHub Username:", githubUsername);

      // Data yang akan disimpan
      const blogData = {
        title: title.trim(),
        content: content.trim(),
        images: imageUrls,
        authorName: user?.displayName || "Anonim",
        authorAvatar: user?.photoURL || "/default-avatar.png",
        authorId: user?.uid || "unknown", // Pastikan ini ada
        authorEmail: user?.email || "", // Simpan email juga
        githubUrl: githubUsername ? `https://github.com/${githubUsername}` : "",
        createdAt: serverTimestamp(),
      };

      console.log("Data yang akan disimpan:", blogData);

      await addDoc(collection(db, "blogs"), blogData);

      alert("Blog berhasil dipublikasikan!");
      router.push("/");
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mempublikasikan blog");
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    // Validasi jumlah file
    if (images.length + files.length > 6) {
      alert("Maksimal 6 gambar yang dapat diunggah");
      return;
    }

    // Validasi ukuran file (max 5MB)
    const oversizedFiles = files.filter((file) => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert("Beberapa file melebihi ukuran maksimal 5MB");
      return;
    }

    setImages((prev) => [...prev, ...files]);
    setPreviewUrls((prev) => [
      ...prev,
      ...files.map((file) => URL.createObjectURL(file)),
    ]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-4">
            Buat Blog Baru
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Bagikan pengetahuan, pengalaman, dan karya terbaik Anda dengan
            komunitas
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* FORM */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <FiFileText className="text-2xl text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Form Publikasi</h2>
                <p className="text-gray-400 text-sm">Isi detail blog Anda</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                <div className="text-right text-xs text-gray-500 mt-1">
                  {title.length}/100 karakter
                </div>
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
                <div className="text-right text-xs text-gray-500 mt-1">
                  {content.length}/5000 karakter
                </div>
              </div>

              <div>
                <label className="block mb-3 text-sm font-medium text-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                    <FiImage className="text-purple-400" />
                    Gambar Pendukung
                    <span className="text-xs text-gray-500">
                      (Opsional, maks. 6 file)
                    </span>
                  </div>
                </label>

                <div className="flex items-center gap-3 mb-4">
                  <label className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-5 py-3 rounded-xl cursor-pointer transition-all shadow-lg hover:shadow-purple-500/25">
                    <FiImage className="text-lg" />
                    <span>Pilih Gambar</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
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
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4"
                    >
                      {previewUrls.map((url, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative group rounded-xl overflow-hidden border border-gray-600 bg-black/20"
                        >
                          <img
                            src={url}
                            alt={`preview-${i}`}
                            className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(i)}
                              className="bg-red-500 hover:bg-red-600 p-2 rounded-full transition-colors"
                            >
                              <FiX className="text-white text-sm" />
                            </button>
                          </div>
                          <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs">
                            {images[i]?.name}
                          </div>
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

          {/* PREVIEW */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-2xl h-fit sticky top-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <FiFileText className="text-2xl text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Preview Blog</h2>
                <p className="text-gray-400 text-sm">Pratinjau tampilan blog</p>
              </div>
            </div>

            {title || content || previewUrls.length > 0 ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3 leading-tight">
                    {title || "Judul Blog Anda"}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <img
                        src={user.photoURL || "/default-avatar.png"}
                        alt="Author"
                        className="w-6 h-6 rounded-full"
                      />
                      <span>{user.displayName || "Anonim"}</span>
                    </div>
                    <span>•</span>
                    <span>{new Date().toLocaleDateString("id-ID")}</span>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                    {content || "Konten blog Anda akan muncul di sini..."}
                  </p>
                </div>

                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    {previewUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`preview-${i}`}
                        className="rounded-lg border border-gray-600 w-full h-40 object-cover shadow-lg"
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiFileText className="text-2xl text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  Preview Belum Tersedia
                </h3>
                <p className="text-gray-500 text-sm">
                  Mulai menulis di form sebelah kiri untuk melihat preview blog
                  di sini
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
