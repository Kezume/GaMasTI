"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, deleteDoc, getDocs, collection } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion, AnimatePresence } from "framer-motion";
import { FiTrash2, FiX, FiAlertTriangle } from "react-icons/fi";
import { toast } from "react-toastify";

interface DeleteBlogButtonProps {
  blogId: string;
  authorId: string;
  authorEmail?: string;
  blogTitle: string;
  onDelete?: () => void;
}

export default function DeleteBlogButton({ blogId, authorId, authorEmail, blogTitle, onDelete }: DeleteBlogButtonProps) {
  const [user] = useAuthState(auth);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fungsi cek ownership yang lebih robust
  const isOwner = async () => {
    if (!user) return false;

    // Cek berdasarkan UID
    if (authorId && user.uid === authorId) {
      return true;
    }

    // Fallback: cek berdasarkan email
    if (authorEmail && user.email && user.email === authorEmail) {
      return true;
    }

    // Cek jika user adalah admin
    try {
      const userDoc = await getDocs(collection(db, "users"));
      const userData = userDoc.docs.find((doc) => doc.id === user.uid);
      if (userData?.data()?.role === "admin") {
        return true;
      }
    } catch (error) {
      console.error("Error checking admin:", error);
    }

    return false;
  };

  const handleDelete = async () => {
    const hasPermission = await isOwner();
    if (!user || !hasPermission) {
      toast.error("Anda tidak memiliki izin untuk menghapus blog ini.");
      return;
    }

    setDeleting(true);
    try {
      await deleteDoc(doc(db, "blogs", blogId));

      if (onDelete) {
        onDelete();
      }

      toast.success("Blog berhasil dihapus! 🗑️");
      setShowConfirm(false);
    } catch (error) {
      console.error("Error deleting blog:", error);
      toast.error("Gagal menghapus blog. Silakan coba lagi.");
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Delete Button - Mobile Friendly */}
      <button onClick={() => setShowConfirm(true)} className="text-red-400 hover:text-red-300 text-xs transition-colors" disabled={deleting} title="Hapus blog">
        Hapus
      </button>

      {/* Confirmation Modal - Responsive */}
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
              className="bg-gradient-to-br from-gray-900 to-black border border-red-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Responsive */}
              <div className="flex items-center gap-2 sm:gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <FiAlertTriangle className="text-xl sm:text-2xl text-red-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Hapus Blog</h3>
                  <p className="text-gray-400 text-xs sm:text-sm">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>

              {/* Content - Responsive */}
              <div className="mb-4 sm:mb-6">
                <p className="text-gray-300 mb-2 text-sm sm:text-base">Anda akan menghapus blog:</p>
                <p className="text-white font-medium bg-white/5 p-2 sm:p-3 rounded-lg border border-white/10 text-sm sm:text-base break-words">"{blogTitle}"</p>
                <p className="text-red-400 text-xs sm:text-sm mt-2 sm:mt-3 flex items-center gap-2">
                  <FiAlertTriangle className="text-xs sm:text-sm flex-shrink-0" />
                  <span>Semua data termasuk gambar akan dihapus permanen</span>
                </p>
              </div>

              {/* Actions - Responsive */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={deleting}
                  className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all disabled:opacity-50 text-sm sm:text-base order-2 sm:order-1"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base order-1 sm:order-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="hidden sm:inline">Menghapus...</span>
                      <span className="sm:hidden">Hapus...</span>
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
