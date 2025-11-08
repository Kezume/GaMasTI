"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";

interface Blog {
  title: string;
  content: string;
  images?: string[];
  authorName?: string;
  authorAvatar?: string;
  githubUrl?: string;
  createdAt?: { seconds: number };
}

export default function BlogDetail() {
  const { id } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      const docRef = doc(db, "blogs", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setBlog(docSnap.data() as Blog);
    };
    fetchBlog();
  }, [id]);

  if (!blog) return <p className="text-center mt-40 text-gray-400">Memuat...</p>;

  return (
    <main className="min-h-screen bg-[#0e0e0e] text-white px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-3xl font-bold mb-4">{blog.title}</h1>
        {blog.authorName && (
          <div className="flex items-center gap-2 text-gray-400 mb-6">
            {blog.authorAvatar && (
              <img src={blog.authorAvatar} className="w-8 h-8 rounded-full" alt="Author" />
            )}
            <span>{blog.authorName}</span>
            {blog.githubUrl && (
              <a
                href={blog.githubUrl}
                target="_blank"
                className="text-blue-400 hover:text-blue-300 ml-2"
              >
                @{blog.githubUrl.split("/").pop()}
              </a>
            )}
          </div>
        )}

        <p className="text-gray-300 leading-relaxed whitespace-pre-line">{blog.content}</p>

        {blog.images && blog.images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {blog.images.map((img, i) => (
              <motion.img
                key={i}
                src={img}
                alt={`image-${i}`}
                className="w-full h-56 object-cover rounded-lg border border-gray-800 hover:scale-105 transition-transform"
                whileHover={{ scale: 1.05 }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </main>
  );
}
