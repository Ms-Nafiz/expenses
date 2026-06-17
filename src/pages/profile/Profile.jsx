import React, { useState, useEffect } from "react";
import Layout from "../../components/layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { subscribeToTransactions } from "../../services/transactionService";
import { motion } from "framer-motion";
import {
  FaUser,
  FaEnvelope,
  FaCalendarAlt,
  FaSignOutAlt,
  FaShieldAlt,
  FaChartPie,
} from "react-icons/fa";

const Profile = () => {
  const { user, logout } = useAuth();
  const [transactionCount, setTransactionCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTransactions(user.uid, (data) => {
      setTransactionCount(data.length);
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const joinDate = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "অনুপলব্ধ";

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">প্রোফাইল সেটিংস</h1>
          <p className="text-slate-400">
            আপনার অ্যাকাউন্ট সম্পর্কিত তথ্য দেখুন এবং পরিচালনা করুন।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: User Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-1 space-y-6"
          >
            <div className="glass p-8 rounded-3xl text-center border border-slate-800">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <FaUser className="text-white text-4xl" />
              </div>
              <h2 className="text-xl font-bold text-white truncate px-2">
                {user?.displayName || "User"}
              </h2>
              <p className="text-slate-400 text-sm mb-6 truncate">
                {user?.email}
              </p>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 py-3 rounded-2xl border border-rose-500/20 transition-all font-medium"
              >
                <FaSignOutAlt />
                লগআউট
              </button>
            </div>

            <div className="glass p-6 rounded-3xl border border-slate-800">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                অ্যাকাউন্ট পরিসংখ্যান
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-slate-300">
                    <FaChartPie className="text-indigo-400" />
                    <span>লেনদেন</span>
                  </div>
                  <span className="font-bold text-white">
                    {transactionCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-slate-300">
                    <FaCalendarAlt className="text-emerald-400" />
                    <span>সদস্যতা শুরু</span>
                  </div>
                  <span className="font-bold text-white text-xs">
                    {joinDate}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Settings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-2 space-y-6"
          >
            <div className="glass p-8 rounded-3xl border border-slate-800">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <FaShieldAlt className="text-indigo-400" />
                অ্যাকাউন্ট নিরাপত্তা
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    ইমেল ঠিকানা
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input
                      type="text"
                      value={user?.email || ""}
                      disabled
                      className="w-full bg-slate-800/30 border border-slate-700/50 rounded-xl px-12 py-3 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 italic">
                    Firebase Authentication দ্বারা যাচাই করা হয়েছে
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/50">
                  <h4 className="font-medium text-slate-300 mb-2">
                    পাসওয়ার্ড ব্যবস্থাপনা
                  </h4>
                  <p className="text-sm text-slate-500 mb-4">
                    পাসওয়ার্ড পরিবর্তন বা নিরাপত্তা সেটিংস আপডেট করতে, আপনার ইমেলে
                    পাঠানো রিসেট লিংক ব্যবহার করুন।
                  </p>
                  <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-all">
                    পাসওয়ার্ড রিসেট অনুরোধ করুন →
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600/10 to-purple-600/10 p-8 rounded-3xl border border-indigo-500/10">
              <h3 className="font-bold text-white mb-2">Premium Support</h3>
              <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                আপনি "আমার হিসাব নিকাশ" ব্যবহারকারী হিসেবে ব্যক্তিগতকৃত AI
                আর্থিক পরামর্শ এবং নিরাপদ ব্যাকআপ সুবিধা পাবেন।
              </p>
              <div className="flex gap-4">
                <div className="flex-1 bg-slate-900/50 p-4 rounded-2xl text-center">
                  <div className="text-2xl font-bold text-indigo-400">
                    99.9%
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-tighter">
                    Uptime
                  </div>
                </div>
                <div className="flex-1 bg-slate-900/50 p-4 rounded-2xl text-center">
                  <div className="text-2xl font-bold text-purple-400">SSL</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-tighter">
                    Encrypted
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
