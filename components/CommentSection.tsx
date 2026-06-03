"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion, AnimatePresence } from "framer-motion";
import { FiMessageSquare, FiStar, FiSend, FiReply, FiTrash2, FiUser } from "react-icons/fi";
import { toast } from "react-toastify";

interface Comment {
  id: string;
  blogId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  rating: number;
  createdAt: any;
  replies?: CommentReply[];
}

interface CommentReply {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: any;
}

interface CommentSectionProps {
  blogId: string;
}

export default function CommentSection({ blogId }: CommentSectionProps) {
  const [user] = useAuthState(auth);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "comments"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Comment))
        .filter((comment) => comment.blogId === blogId);
      setComments(commentsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [blogId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Silakan login untuk memberikan komentar");
      return;
    }
    if (!newComment.trim()) {
      toast.error("Komentar tidak boleh kosong");
      return;
    }
    if (rating === 0) {
      toast.error("Silakan berikan rating");
      return;
    }

    try {
      await addDoc(collection(db, "comments"), {
        blogId,
        userId: user.uid,
        userName: user.displayName || "Anonim",
        userAvatar: user.photoURL || undefined,
        content: newComment.trim(),
        rating,
        createdAt: serverTimestamp(),
        replies: [],
      });
      setNewComment("");
      setRating(0);
      toast.success("Komentar berhasil ditambahkan!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Gagal menambahkan komentar");
    }
  };

  const handleReply = async (commentId: string) => {
    if (!user) {
      toast.error("Silakan login untuk membalas");
      return;
    }
    if (!replyContent.trim()) {
      toast.error("Balasan tidak boleh kosong");
      return;
    }

    try {
      const commentRef = doc(db, "comments", commentId);
      const reply: CommentReply = {
        id: Math.random().toString(36).substring(2, 11),
        userId: user.uid,
        userName: user.displayName || "Anonim",
        userAvatar: user.photoURL || undefined,
        content: replyContent.trim(),
        createdAt: serverTimestamp(),
      };

      await updateDoc(commentRef, {
        replies: arrayUnion(reply),
      });
      setReplyContent("");
      setReplyingTo(null);
      toast.success("Balasan berhasil ditambahkan!");
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("Gagal menambahkan balasan");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, "comments", commentId), {
        content: "[Komentar telah dihapus]",
        replies: [],
      });
      toast.success("Komentar berhasil dihapus");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Gagal menghapus komentar");
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const canDelete = (comment: Comment) => {
    return user && (user.uid === comment.userId);
  };

  return (
    <div className="mt-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8"
      >
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <FiMessageSquare className="text-blue-400" />
          Komentar & Rating
          <span className="text-sm font-normal text-gray-400">({comments.length})</span>
        </h2>

        {/* Add Comment Form */}
        {user ? (
          <form onSubmit={handleSubmitComment} className="mb-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Rating Anda</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-3xl transition-transform hover:scale-110"
                  >
                    <FiStar
                      className={`${
                        star <= (hoverRating || rating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Komentar Anda</label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Bagikan pendapat Anda tentang blog ini..."
                rows={4}
                className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-6 py-3 rounded-xl font-medium transition-all shadow-lg"
            >
              <FiSend />
              Kirim Komentar
            </button>
          </form>
        ) : (
          <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-center">
            <p className="text-blue-400">Silakan login untuk memberikan komentar dan rating</p>
          </div>
        )}

        {/* Comments List */}
        {loading ? (
          <div className="text-center py-8 text-gray-400">Memuat komentar...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-white/10 rounded-xl">
            <FiMessageSquare className="text-4xl mx-auto mb-3 text-gray-600" />
            <p>Belum ada komentar. Jadilah yang pertama berkomentar!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6"
              >
                {/* Comment Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
                    {comment.userAvatar ? (
                      <img src={comment.userAvatar} alt={comment.userName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <FiUser className="text-white text-xl" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{comment.userName}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FiStar
                            key={star}
                            className={`text-sm ${star <= comment.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                  </div>
                  {canDelete(comment) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-2 rounded-lg transition-colors"
                      title="Hapus komentar"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>

                {/* Comment Content */}
                <p className="text-gray-300 mb-4 whitespace-pre-line">{comment.content}</p>

                {/* Reply Button */}
                {user && (
                  <button
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                  >
                    <FiReply />
                    {replyingTo === comment.id ? "Batal Balas" : "Balas"}
                  </button>
                )}

                {/* Reply Form */}
                <AnimatePresence>
                  {replyingTo === comment.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pl-4 border-l-2 border-blue-500/30"
                    >
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleReply(comment.id);
                        }}
                        className="space-y-3"
                      >
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Tulis balasan Anda..."
                          rows={3}
                          className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <FiSend />
                            Kirim Balasan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent("");
                            }}
                            className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            Batal
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 space-y-4 pl-4 border-l-2 border-white/10">
                    {comment.replies.map((reply) => (
                      <motion.div
                        key={reply.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                          {reply.userAvatar ? (
                            <img src={reply.userAvatar} alt={reply.userName} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <FiUser className="text-white text-sm" />
                          )}
                        </div>
                        <div className="flex-1 bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white text-sm">{reply.userName}</span>
                            <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                          </div>
                          <p className="text-gray-300 text-sm whitespace-pre-line">{reply.content}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
