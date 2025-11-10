"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiFileText,
  FiSettings,
  FiEye,
  FiEyeOff,
  FiTrash2,
  FiEdit3,
  FiUserCheck,
  FiUserX,
  FiCheck,
  FiX,
  FiBarChart,
  FiPlus,
  FiMail,
  FiSearch,
} from "react-icons/fi";

interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: string;
  createdAt: any;
}

interface Blog {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorId: string;
  status: string;
  images?: string[];
  createdAt: any;
  updatedAt?: any;
}

export default function AdminDashboard() {
  const [user] = useAuthState(auth);
  const [users, setUsers] = useState<User[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "blogs">(
    "overview"
  );
  const [isAdmin, setIsAdmin] = useState(false);

  // State untuk add admin
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  // Check if current user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        try {
          const userDoc = await getDocs(collection(db, "users"));
          const userData = userDoc.docs.find((doc) => doc.id === user.uid);
          if (userData?.data()?.role === "admin") {
            setIsAdmin(true);
            fetchData();
          }
        } catch (error) {
          console.error("Error checking admin:", error);
        }
      }
    };
    checkAdmin();
  }, [user]);

  // Di admin dashboard - update fetchData function
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch users - tanpa filter untuk mendapatkan semua user
      const usersQuery = query(
        collection(db, "users"),
        orderBy("createdAt", "desc")
      );
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as User[];

      console.log("Fetched users:", usersData); // Debug log
      setUsers(usersData);

      // Fetch all blogs
      const blogsQuery = query(
        collection(db, "blogs"),
        orderBy("createdAt", "desc")
      );
      const blogsSnapshot = await getDocs(blogsQuery);
      const blogsData = blogsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Blog[];
      setBlogs(blogsData);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Search user by email
  const searchUserByEmail = async () => {
    if (!searchEmail.trim()) return;

    setSearching(true);
    try {
      const usersQuery = query(
        collection(db, "users"),
        where("email", ">=", searchEmail),
        where("email", "<=", searchEmail + "\uf8ff")
      );
      const usersSnapshot = await getDocs(usersQuery);
      const results = usersSnapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as User[];

      setSearchResults(results);
    } catch (error) {
      console.error("Error searching user:", error);
      alert("Error searching user");
    } finally {
      setSearching(false);
    }
  };

  // Add admin by email
  const addAdminByEmail = async () => {
    if (!adminEmail.trim()) {
      alert("Email harus diisi");
      return;
    }

    try {
      // Cari user berdasarkan email
      const usersQuery = query(
        collection(db, "users"),
        where("email", "==", adminEmail.trim().toLowerCase())
      );
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        alert("User dengan email tersebut tidak ditemukan");
        return;
      }

      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();

      // Update role menjadi admin
      await updateDoc(doc(db, "users", userDoc.id), {
        role: "admin",
        updatedAt: new Date(),
      });

      // Update state
      setUsers(
        users.map((user) =>
          user.uid === userDoc.id ? { ...user, role: "admin" } : user
        )
      );

      setAdminEmail("");
      setShowAddAdmin(false);
      alert(`User ${userData.email} berhasil dijadikan admin`);
    } catch (error) {
      console.error("Error adding admin:", error);
      alert("Gagal menambahkan admin");
    }
  };

  // Admin actions
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        role: newRole,
        updatedAt: new Date(),
      });
      setUsers(
        users.map((user) =>
          user.uid === userId ? { ...user, role: newRole } : user
        )
      );
      alert(`Role user berhasil diubah menjadi ${newRole}`);
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Gagal mengubah role user");
    }
  };

  const updateBlogStatus = async (blogId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "blogs", blogId), {
        status: newStatus,
        updatedAt: new Date(),
      });
      setBlogs(
        blogs.map((blog) =>
          blog.id === blogId ? { ...blog, status: newStatus } : blog
        )
      );
      alert(`Status blog berhasil diubah menjadi ${newStatus}`);
    } catch (error) {
      console.error("Error updating blog status:", error);
      alert("Gagal mengubah status blog");
    }
  };

  const deleteBlog = async (blogId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus blog ini?")) return;

    try {
      await deleteDoc(doc(db, "blogs", blogId));
      setBlogs(blogs.filter((blog) => blog.id !== blogId));
      alert("Blog berhasil dihapus");
    } catch (error) {
      console.error("Error deleting blog:", error);
      alert("Gagal menghapus blog");
    }
  };

  // Stats calculation
  const stats = {
    totalUsers: users.length,
    totalBlogs: blogs.length,
    publishedBlogs: blogs.filter((blog) => blog.status === "published").length,
    draftBlogs: blogs.filter((blog) => blog.status === "draft").length,
    pendingBlogs: blogs.filter(
      (blog) => !blog.status || blog.status === "pending"
    ).length,
    adminUsers: users.filter((user) => user.role === "admin").length,
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Akses Ditolak</h1>
          <p className="text-gray-400">Silakan login terlebih dahulu.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiUserX className="text-2xl text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Akses Ditolak</h1>
          <p className="text-gray-400">Anda tidak memiliki akses admin.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Memuat dashboard admin...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <nav className="fixed top-0 left-0 w-full z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <FiSettings className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-xs text-gray-400">Panel Administrasi</p>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              Logged in as: <span className="text-blue-400">{user.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-white/5 rounded-2xl p-2 border border-white/10">
          {[
            { id: "overview", label: "Overview", icon: FiBarChart },
            { id: "users", label: "Users", icon: FiUsers },
            { id: "blogs", label: "Blogs", icon: FiFileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <tab.icon className="text-lg" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold">Dashboard Overview</h2>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    label: "Total Users",
                    value: stats.totalUsers,
                    icon: FiUsers,
                    color: "blue",
                  },
                  {
                    label: "Total Blogs",
                    value: stats.totalBlogs,
                    icon: FiFileText,
                    color: "green",
                  },
                  {
                    label: "Published",
                    value: stats.publishedBlogs,
                    icon: FiEye,
                    color: "purple",
                  },
                  {
                    label: "Admin Users",
                    value: stats.adminUsers,
                    icon: FiUserCheck,
                    color: "pink",
                  },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">{stat.label}</p>
                        <p className="text-3xl font-bold text-white mt-2">
                          {stat.value}
                        </p>
                      </div>
                      <div
                        className={`w-12 h-12 bg-${stat.color}-500/20 rounded-xl flex items-center justify-center`}
                      >
                        <stat.icon
                          className={`text-2xl text-${stat.color}-400`}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Blogs */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Blogs Terbaru</h3>
                  <div className="space-y-3">
                    {blogs.slice(0, 5).map((blog) => (
                      <div
                        key={blog.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {blog.title}
                          </p>
                          <p className="text-xs text-gray-400">
                            {blog.authorName}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            blog.status === "published"
                              ? "bg-green-500/20 text-green-400"
                              : blog.status === "draft"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {blog.status || "pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Users */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Users Terbaru</h3>
                  <div className="space-y-3">
                    {users.slice(0, 5).map((user) => (
                      <div
                        key={user.uid}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={user.photoURL || "/default-avatar.png"}
                            alt={user.displayName}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <p className="text-sm font-medium text-white">
                              {user.displayName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.role === "admin"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold">Manajemen User</h2>

                <button
                  onClick={() => setShowAddAdmin(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-4 py-2 rounded-xl font-medium transition-all shadow-lg hover:shadow-green-500/25"
                >
                  <FiPlus className="text-lg" />
                  <span>Tambah Admin</span>
                </button>
              </div>

              {/* Add Admin Modal */}
              {showAddAdmin && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FiUserCheck className="text-green-400" />
                    Tambah Admin Baru
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Masukkan Email User
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          placeholder="contoh: user@example.com"
                          className="flex-1 bg-black/30 border border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                        />
                        <button
                          onClick={addAdminByEmail}
                          className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl font-medium transition-colors"
                        >
                          Tambah
                        </button>
                        <button
                          onClick={() => setShowAddAdmin(false)}
                          className="bg-gray-500 hover:bg-gray-600 px-4 py-3 rounded-xl font-medium transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    </div>

                    {/* Email Search Section */}
                    <div className="border-t border-white/10 pt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Cari User by Email
                      </label>
                      <div className="flex gap-2 mb-3">
                        <div className="flex-1 relative">
                          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={searchEmail}
                            onChange={(e) => setSearchEmail(e.target.value)}
                            placeholder="Cari user berdasarkan email..."
                            className="w-full bg-black/30 border border-gray-600 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                        <button
                          onClick={searchUserByEmail}
                          disabled={searching}
                          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 px-6 py-3 rounded-xl font-medium transition-colors"
                        >
                          {searching ? "Searching..." : "Search"}
                        </button>
                      </div>

                      {/* Search Results */}
                      {searchResults.length > 0 && (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {searchResults.map((result) => (
                            <div
                              key={result.uid}
                              className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={result.photoURL || "/default-avatar.png"}
                                  alt={result.displayName}
                                  className="w-8 h-8 rounded-full"
                                />
                                <div>
                                  <p className="text-sm font-medium text-white">
                                    {result.displayName}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {result.email}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    result.role === "admin"
                                      ? "bg-purple-500/20 text-purple-400"
                                      : "bg-blue-500/20 text-blue-400"
                                  }`}
                                >
                                  {result.role}
                                </span>
                                {result.role !== "admin" && (
                                  <button
                                    onClick={() => {
                                      setAdminEmail(result.email);
                                      setSearchResults([]);
                                    }}
                                    className="text-green-400 hover:text-green-300 text-sm"
                                  >
                                    Pilih
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-4 text-sm font-medium text-gray-400">
                          User
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-gray-400">
                          Email
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-gray-400">
                          Role
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-gray-400">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr
                          key={user.uid}
                          className="border-b border-white/10 last:border-0"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={user.photoURL || "/default-avatar.png"}
                                alt={user.displayName}
                                className="w-10 h-10 rounded-full"
                              />
                              <div>
                                <p className="font-medium text-white">
                                  {user.displayName}
                                </p>
                                <p className="text-sm text-gray-400">
                                  ID: {user.uid.substring(0, 8)}...
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-gray-300">{user.email}</td>
                          <td className="p-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm ${
                                user.role === "admin"
                                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                  : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {user.role === "user" ? (
                                <button
                                  onClick={() =>
                                    updateUserRole(user.uid, "admin")
                                  }
                                  className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 hover:text-purple-300 px-3 py-2 rounded-xl transition-all"
                                >
                                  <FiUserCheck className="text-sm" />
                                  <span>Make Admin</span>
                                </button>
                              ) : (
                                user.uid !== auth.currentUser?.uid && (
                                  <button
                                    onClick={() =>
                                      updateUserRole(user.uid, "user")
                                    }
                                    className="flex items-center gap-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30 text-gray-400 hover:text-gray-300 px-3 py-2 rounded-xl transition-all"
                                  >
                                    <FiUserX className="text-sm" />
                                    <span>Remove Admin</span>
                                  </button>
                                )
                              )}
                              {user.uid === auth.currentUser?.uid && (
                                <span className="text-xs text-gray-500">
                                  Current User
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Blogs Tab */}
          {activeTab === "blogs" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold">Manajemen Blog</h2>

              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-4 text-sm font-medium text-gray-400">
                          Judul
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-gray-400">
                          Author
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-gray-400">
                          Status
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-gray-400">
                          Tanggal
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-gray-400">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {blogs.map((blog) => (
                        <tr
                          key={blog.id}
                          className="border-b border-white/10 last:border-0 hover:bg-white/5"
                        >
                          <td className="p-4">
                            <p className="font-medium text-white line-clamp-2">
                              {blog.title}
                            </p>
                            <p className="text-sm text-gray-400 line-clamp-1">
                              {blog.content.substring(0, 50)}...
                            </p>
                          </td>
                          <td className="p-4 text-gray-300">
                            {blog.authorName}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm ${
                                blog.status === "published"
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                  : blog.status === "draft"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                  : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                              }`}
                            >
                              {blog.status || "pending"}
                            </span>
                          </td>
                          <td className="p-4 text-gray-300 text-sm">
                            {blog.createdAt
                              ?.toDate?.()
                              .toLocaleDateString("id-ID")}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {/* Publish/Unpublish */}
                              {blog.status !== "published" ? (
                                <button
                                  onClick={() =>
                                    updateBlogStatus(blog.id, "published")
                                  }
                                  className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 hover:text-green-300 p-2 rounded-xl transition-all"
                                  title="Publish"
                                >
                                  <FiCheck className="text-sm" />
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    updateBlogStatus(blog.id, "draft")
                                  }
                                  className="flex items-center gap-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 hover:text-yellow-300 p-2 rounded-xl transition-all"
                                  title="Unpublish"
                                >
                                  <FiEyeOff className="text-sm" />
                                </button>
                              )}

                              {/* Reject */}
                              {blog.status !== "rejected" && (
                                <button
                                  onClick={() =>
                                    updateBlogStatus(blog.id, "rejected")
                                  }
                                  className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 hover:text-red-300 p-2 rounded-xl transition-all"
                                  title="Reject"
                                >
                                  <FiX className="text-sm" />
                                </button>
                              )}

                              {/* Delete */}
                              <button
                                onClick={() => deleteBlog(blog.id)}
                                className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 hover:text-red-300 p-2 rounded-xl transition-all"
                                title="Delete"
                              >
                                <FiTrash2 className="text-sm" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}
