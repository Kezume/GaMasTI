"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { FiTrash2, FiX, FiAlertTriangle } from "react-icons/fi";

interface DeleteBlogButtonProps {
  blogId: string;
  authorId: string;
  authorEmail?: string;
  blogTitle: string;
  onDelete?: () => void;
}

export default function DeleteBlogButton({ 
  blogId, 
  authorId, 
  authorEmail,
  blogTitle,
  onDelete 
}: DeleteBlogButtonProps) {
  const [user] = useAuthState(auth);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fungsi cek ownership yang lebih robust
  const isOwner = () => {
    if (!user) return false;
    
    console.log("=== DELETE BUTTON OWNERSHIP CHECK ===");
    console.log("User UID:", user.uid);
    console.log("Blog Author ID:", authorId);
    console.log("User Email:", user.email);
    console.log("Blog Author Email:", authorEmail);

    // Cek berdasarkan UID
    if (authorId && user.uid === authorId) {
      console.log("✅ Delete allowed - UID match");
      return true;
    }

    // Fallback: cek berdasarkan email
    if (authorEmail && user.email && user.email === authorEmail) {
      console.log("✅ Delete allowed - Email match");
      return true;
    }

    console.log("❌ Delete not allowed - No ownership");
    return false;
  };

  const handleDelete = async () => {
    if (!user || !isOwner()) {
      alert("Anda tidak memiliki izin untuk menghapus blog ini.");
      return;
    }

    setDeleting(true);
    try {
      await deleteDoc(doc(db, "blogs", blogId));
      
      if (onDelete) {
        onDelete();
      }
      
      alert("Blog berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting blog:", error);
      alert("Gagal menghapus blog. Silakan coba lagi.");
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  if (!isOwner()) {
    console.log("❌ Delete button not rendered - User is not owner");
    return null;
  }

  return (
    <>
      {/* Delete Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 hover:text-red-300 px-4 py-2 rounded-xl transition-all duration-200"
        disabled={deleting}
      >
        <FiTrash2 className="text-sm" />
        <span>Hapus</span>
      </motion.button>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !deleting && setShowConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-gray-900 to-black border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <FiAlertTriangle className="text-2xl text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Hapus Blog</h3>
                  <p className="text-gray-400 text-sm">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>

              {/* Content */}
              <div className="mb-6">
                <p className="text-gray-300 mb-2">
                  Anda akan menghapus blog:
                </p>
                <p className="text-white font-medium bg-white/5 p-3 rounded-lg border border-white/10">
                  "{blogTitle}"
                </p>
                <p className="text-red-400 text-sm mt-3 flex items-center gap-2">
                  <FiAlertTriangle className="text-sm" />
                  Semua data termasuk gambar akan dihapus permanen
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={deleting}
                  className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 rounded-xl font-medium transition-all disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-3 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="text-sm" />
                      Ya, Hapus
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}