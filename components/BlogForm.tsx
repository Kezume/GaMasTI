"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { FiPlus, FiTrash2, FiType, FiFileText, FiYoutube, FiImage, FiArrowUp, FiArrowDown, FiCode } from "react-icons/fi";
import { toast } from "react-toastify";

type BlockType = "subtitle" | "text" | "youtube" | "image" | "code";

interface ContentBlock {
  id: string;
  type: BlockType;
  content: string;
  language?: string; // untuk code block
}

export default function BlogForm() {
  const [title, setTitle] = useState("");
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [user] = useAuthState(auth);
  const [uploading, setUploading] = useState(false);

  const generateId = () => Math.random().toString(36).substring(2, 11);

  const addBlock = (type: BlockType) => {
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      content: "",
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const updateBlock = (id: string, content: string) => {
    setContentBlocks(contentBlocks.map((block) => (block.id === id ? { ...block, content } : block)));
  };

  const removeBlock = (id: string) => {
    setContentBlocks(contentBlocks.filter((block) => block.id !== id));
  };

  const moveBlockUp = (index: number) => {
    if (index === 0) return; // Already at top
    const newBlocks = [...contentBlocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    setContentBlocks(newBlocks);
  };

  const moveBlockDown = (index: number) => {
    if (index === contentBlocks.length - 1) return; // Already at bottom
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

  const handleImageUpload = async (id: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 5MB");
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      updateBlock(id, imageUrl);
      toast.success("Gambar berhasil diunggah!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Gagal mengunggah gambar");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Harus login dulu");

    if (!title.trim()) {
      return toast.error("Judul blog tidak boleh kosong");
    }

    if (contentBlocks.length === 0) {
      return toast.error("Tambahkan minimal satu konten block");
    }

    // Validasi setiap block
    for (const block of contentBlocks) {
      if (!block.content.trim()) {
        return toast.error(`Block ${block.type} tidak boleh kosong`);
      }
      if (block.type === "youtube" && !isValidYouTubeUrl(block.content)) {
        return toast.error("URL YouTube tidak valid");
      }
    }

    const loadingToast = toast.loading("Menambahkan blog...");

    try {
      // Ambil data GitHub dari providerData
      const githubProfile = user.providerData.find((p) => p.providerId === "github.com");
      const githubUsername = githubProfile?.uid;
      const githubUrl = githubUsername ? `https://github.com/${githubUsername}` : "";

      await addDoc(collection(db, "blogs"), {
        title: title.trim(),
        contentBlocks,
        authorId: user.uid,
        authorName: user.displayName,
        authorAvatar: user.photoURL,
        githubUrl,
        createdAt: serverTimestamp(),
      });

      setTitle("");
      setContentBlocks([]);

      toast.update(loadingToast, {
        render: "Blog berhasil ditambahkan! 🎉",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error adding blog:", error);
      toast.update(loadingToast, {
        render: "Gagal menambahkan blog. Silakan coba lagi.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Title Input - Always at top */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Judul Blog <span className="text-red-500">*</span>
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Masukkan judul blog..."
          className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Content Blocks */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-300">Konten Blog</label>

        {contentBlocks.map((block, index) => (
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
                <span className="text-gray-600">#{index + 1}</span>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center gap-2">
                {/* Move Up Button */}
                <button
                  type="button"
                  onClick={() => moveBlockUp(index)}
                  disabled={index === 0}
                  className={`p-1.5 rounded transition-colors ${index === 0 ? "text-gray-600 cursor-not-allowed" : "text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"}`}
                  title="Pindah ke atas"
                >
                  <FiArrowUp />
                </button>

                {/* Move Down Button */}
                <button
                  type="button"
                  onClick={() => moveBlockDown(index)}
                  disabled={index === contentBlocks.length - 1}
                  className={`p-1.5 rounded transition-colors ${index === contentBlocks.length - 1 ? "text-gray-600 cursor-not-allowed" : "text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"}`}
                  title="Pindah ke bawah"
                >
                  <FiArrowDown />
                </button>

                {/* Delete Button */}
                <button type="button" onClick={() => removeBlock(block.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1.5 rounded transition-colors" title="Hapus block">
                  <FiTrash2 />
                </button>
              </div>
            </div>

            {block.type === "subtitle" && (
              <input
                type="text"
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value)}
                placeholder="Masukkan sub judul..."
                className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            )}

            {block.type === "text" && (
              <textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value)}
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
                  onChange={(e) => updateBlock(block.id, e.target.value)}
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
                        if (file) handleImageUpload(block.id, file);
                      }}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img src={block.content} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                    <button type="button" onClick={() => updateBlock(block.id, "")} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full" title="Ganti gambar">
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
                    const newBlocks = contentBlocks.map((b) => (b.id === block.id ? { ...b, language: e.target.value } : b));
                    setContentBlocks(newBlocks);
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
                  onChange={(e) => updateBlock(block.id, e.target.value)}
                  placeholder="Paste kode Anda di sini..."
                  rows={10}
                  className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-orange-500 outline-none resize-none font-mono text-sm"
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

        {contentBlocks.length === 0 && <div className="text-center py-8 text-gray-500 border-2 border-dashed border-white/10 rounded-xl">Belum ada konten. Tambahkan block di bawah.</div>}
      </div>

      {/* Add Block Buttons */}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => addBlock("subtitle")} className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-lg transition-colors">
          <FiType />
          Tambah Sub Judul
        </button>
        <button type="button" onClick={() => addBlock("text")} className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg transition-colors">
          <FiFileText />
          Tambah Konten
        </button>
        <button type="button" onClick={() => addBlock("youtube")} className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors">
          <FiYoutube />
          Tambah Video
        </button>
        <button type="button" onClick={() => addBlock("image")} className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 px-4 py-2 rounded-lg transition-colors">
          <FiImage />
          Tambah Gambar
        </button>
        <button type="button" onClick={() => addBlock("code")} className="flex items-center gap-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-400 px-4 py-2 rounded-lg transition-colors">
          <FiCode />
          Tambah Kode
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={uploading}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? "Mengunggah..." : "Tambahkan Blog"}
      </button>
    </form>
  );
}
