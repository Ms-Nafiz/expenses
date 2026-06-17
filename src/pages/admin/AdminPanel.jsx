import React, { useState, useEffect } from "react";
import Layout from "../../components/layout/Layout";
import {
  subscribeToAllUsers,
  updateUserStatus,
} from "../../services/userService";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserShield,
  FaCheckCircle,
  FaClock,
  FaEnvelope,
  FaUserEdit,
} from "react-icons/fa";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAllUsers((data) => {
      setUsers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "pending" : "active";
    try {
      await updateUserStatus(userId, newStatus);
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Error updating user status");
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <FaUserShield className="text-indigo-400" />
          অ্যাডমিন কন্ট্রোল প্যানেল
        </h1>
        <p className="text-slate-400">
          ব্যবহারকারীর প্রবেশাধিকার ও অনুমোদন পরিচালনা করুন।
        </p>
      </div>

      <div className="glass rounded-3xl overflow-hidden border border-slate-800">
        {/* Mobile view: stacked cards */}
        <div className="lg:hidden divide-y divide-slate-800">
          <AnimatePresence>
            {users.map((u) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <FaEnvelope />
                    </div>
                    <div>
                      <div className="text-slate-200 font-medium text-sm truncate">
                        {u.email}
                      </div>
                      <div className="text-slate-400 text-xs">
                        {u.createdAt?.toDate
                          ? u.createdAt.toDate().toLocaleDateString()
                          : "অনুপলব্ধ"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        u.role === "admin"
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {u.role || "user"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    {u.status === "active" ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <FaCheckCircle /> সক্রিয়
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                        <FaClock /> অনুমোদনের অপেক্ষায়
                      </span>
                    )}
                  </div>
                  <div>
                    {u.role !== "admin" && (
                      <button
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          u.status === "active"
                            ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                        }`}
                      >
                        {u.status === "active" ? "সাসপেন্ড" : "অনুমোদন"}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Desktop/tablet view */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">ইমেল</th>
                <th className="px-6 py-4 font-medium">যোগদানের তারিখ</th>
                <th className="px-6 py-4 font-medium">ভূমিকা</th>
                <th className="px-6 py-4 font-medium">স্ট্যাটাস</th>
                <th className="px-6 py-4 font-medium text-right">কর্ম</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <AnimatePresence>
                {users.map((u) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-800/30 transition-all"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                          <FaEnvelope size={12} />
                        </div>
                        <span className="text-slate-200 text-sm">
                          {u.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {u.createdAt?.toDate
                        ? u.createdAt.toDate().toLocaleDateString()
                        : "অনুপলব্ধ"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.role === "admin"
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {u.role || "user"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {u.status === "active" ? (
                          <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                            <FaCheckCircle /> সক্রিয়
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                            <FaClock /> অনুমোদনের অপেক্ষায়
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== "admin" && (
                        <button
                          onClick={() => handleToggleStatus(u.id, u.status)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            u.status === "active"
                              ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                          }`}
                        >
                          {u.status === "active" ? "সাসপেন্ড" : "অনুমোদন"}
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {users.length === 0 && !loading && (
          <div className="p-12 text-center text-slate-500">
            সিস্টেমে কোনো ব্যবহারকারী নেই।
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminPanel;
