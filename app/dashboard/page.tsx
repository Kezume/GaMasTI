"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion } from "framer-motion";
import { FiImage, FiUpload, FiX } from "react-icons/fi";
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
      <div className="text-center mt-40 text-gray-400">
        Silakan login terlebih dahulu.
      </div>
    );

  // Upload ke Cloudinary
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
    if (!title || !content) return alert("Lengkapi semua field!");

    setUploading(true);
    try {
      const imageUrls = await uploadImagesToCloudinary();
      const githubProfile = user.providerData.find(
        (p) => p.providerId === "github.com"
      );
      const githubUsername =
        githubProfile?.uid ||
        githubProfile?.displayName ||
        user.displayName ||
        "";

      await addDoc(collection(db, "blogs"), {
        title,
        content,
        images: imageUrls,
        authorName: user.displayName || "Anonim",
        authorAvatar: user.photoURL || "",
        githubUrl: githubUsername
          ? `https://github.com/${githubUsername}`
          : null,
        createdAt: serverTimestamp(),
      });

      alert("Blog berhasil ditambahkan!");
      router.push("/");
    } catch (err) {
      console.error(err);
      alert("Gagal menambah blog");
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
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
    <main className="min-h-screen bg-[#0e0e0e] text-white px-6 py-20">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10">
        {/* FORM */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#1a1a1a] border border-gray-800 p-8 rounded-2xl shadow-lg"
        >
          <h1 className="text-2xl font-semibold mb-6">📝 Tambah Blog Baru</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 text-sm text-gray-400">Judul</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#0e0e0e] border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
                placeholder="Masukkan judul blog..."
              />
            </div>

            <div>
              <label className="block mb-2 text-sm text-gray-400">Konten</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full bg-[#0e0e0e] border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
                placeholder="Tulis isi blogmu di sini..."
              />
            </div>

            <div>
              <label className="block mb-3 text-sm text-gray-400">
                Gambar (bisa lebih dari satu)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg cursor-pointer transition">
                  <FiImage />
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
                    className="text-sm text-red-400 hover:text-red-300 underline"
                  >
                    Hapus semua
                  </button>
                )}
              </div>

              {previewUrls.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                  {previewUrls.map((url, i) => (
                    <div
                      key={i}
                      className="relative group rounded-lg overflow-hidden border border-gray-800"
                    >
                      <img
                        src={url}
                        alt={`preview-${i}`}
                        className="w-full h-28 object-cover group-hover:opacity-80 transition"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full hover:bg-red-600 transition"
                      >
                        <FiX className="text-white text-sm" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 text-center">
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-lg font-medium transition disabled:opacity-50"
              >
                <FiUpload />
                {uploading ? "Mengunggah..." : "Publikasikan"}
              </button>
            </div>
          </form>
        </motion.div>

        {/* PREVIEW */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-[#1a1a1a] border border-gray-800 p-8 rounded-2xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-300">
            👁️ Preview Blog
          </h2>

          {title || content || previewUrls.length > 0 ? (
            <>
              <h3 className="text-2xl font-bold mb-2">{title || "Tanpa Judul"}</h3>
              <p className="text-gray-400 whitespace-pre-line">
                {content || "Belum ada konten."}
              </p>

              {previewUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
                  {previewUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`preview-${i}`}
                      className="rounded-lg border border-gray-800 w-full h-40 object-cover"
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 italic">
              Isi form di kiri untuk melihat preview blog di sini.
            </p>
          )}
        </motion.div>
      </div>
    </main>
  );
}
