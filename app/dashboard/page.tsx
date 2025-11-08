"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion } from "framer-motion";
import { FiImage, FiUpload } from "react-icons/fi";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [user] = useAuthState(auth);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  if (!user) return <div className="text-center mt-20 text-gray-400">Silakan login terlebih dahulu.</div>;

  // Upload file ke Cloudinary
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

  // Submit blog ke Firestore
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!title || !content) return alert("Lengkapi semua field!");

  setUploading(true);
  try {
    const imageUrls = await uploadImagesToCloudinary();

    // 🔍 Ambil username GitHub dengan cara aman
    const githubProfile = user.providerData.find(
      (p) => p.providerId === "github.com"
    );
    const githubUsername =
      githubProfile?.uid || githubProfile?.displayName || user.displayName;

    await addDoc(collection(db, "blogs"), {
      title,
      content,
      images: imageUrls,
      authorName: user.displayName || "Anonim",
      authorAvatar: user.photoURL || "",
      githubUrl: githubUsername ? `https://github.com/${githubUsername}` : null,
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

  return (
    <main className="min-h-screen bg-[#0e0e0e] text-white px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto bg-[#1a1a1a] border border-gray-800 p-8 rounded-2xl shadow-lg"
      >
        <h1 className="text-2xl font-semibold mb-6">📝 Tambah Blog Baru</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
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
              rows={5}
              className="w-full bg-[#0e0e0e] border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
              placeholder="Tulis isi blogmu di sini..."
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-gray-400">Gambar (bisa lebih dari satu)</label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg cursor-pointer">
                <FiImage />
                <span>Pilih Gambar</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setImages(Array.from(e.target.files || []))}
                  className="hidden"
                />
              </label>
              {images.length > 0 && (
                <span className="text-gray-400 text-sm">{images.length} file dipilih</span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg font-medium transition disabled:opacity-50"
          >
            <FiUpload />
            {uploading ? "Mengunggah..." : "Publikasikan"}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
