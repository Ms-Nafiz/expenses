import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { FaGoogle, FaEnvelope, FaLock, FaUser } from "react-icons/fa";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("পাসওয়ার্ড মিলছে না");
    }
    try {
      setError("");
      setLoading(true);
      await register(email, password);
      navigate("/");
    } catch (err) {
      setError("অ্যাকাউন্ট তৈরি করা যায়নি: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate("/");
    } catch (err) {
      setError("Google লগইন ব্যর্থ: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass p-8 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            আমার হিসাব নিকাশ-এ যোগ দিন
          </h1>
          <p className="text-slate-400 mt-2">
            আর্থিক স্বাধীনতার যাত্রা শুরু করুন।
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              placeholder="ইমেল ঠিকানা"
              required
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-12 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="password"
              placeholder="পাসওয়ার্ড"
              required
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-12 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="relative">
            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="password"
              placeholder="পাসওয়ার্ড পুনরায় লিখুন"
              required
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-12 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? "অ্যাকাউন্ট তৈরি করা হচ্ছে..." : "অ্যাকাউন্ট তৈরি করুন"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-900 text-slate-500">
              অথবা এগুলো দিয়ে চালিয়ে যান
            </span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-slate-800/50 border border-slate-700 text-white py-3 rounded-xl flex items-center justify-center space-x-2 hover:bg-slate-800 transition-all"
        >
          <FaGoogle className="text-red-500" />
          <span>Google দিয়ে রেজিস্টার করুন</span>
        </button>

        <p className="text-center text-slate-400 mt-8">
          ইতিমধ্যেই একটি অ্যাকাউন্ট আছে?{" "}
          <Link
            to="/login"
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            লগইন করুন
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
