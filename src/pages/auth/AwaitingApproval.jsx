import React from "react";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { FaClock, FaSignOutAlt, FaShieldAlt } from "react-icons/fa";

const AwaitingApproval = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass p-10 rounded-[2.5rem] text-center border border-slate-800 shadow-2xl relative z-10"
      >
        <div className="w-24 h-24 bg-amber-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-amber-500/20 text-amber-500">
          <FaClock size={40} className="animate-pulse" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">
           অনুমোদনের অপেক্ষায়
        </h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          <span className="text-indigo-400 font-bold">আমার হিসাব নিকাশ</span>-এ স্বাগতম,
          <br />
          <span className="text-slate-300 font-medium">{user?.email}</span>
          <br /><br />
          আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। বর্তমানে এটি প্রশাসকের
          যাচাইকরণ অপেক্ষায় আছে। অ্যাকাউন্ট সক্রিয় হলে অনুগ্রহ করে পরে আবার
          দেখে নিন।
        </p>

        <div className="bg-slate-900/50 p-6 rounded-3xl mb-8 border border-slate-800 flex items-center gap-4 text-left">
          <FaShieldAlt className="text-indigo-400 shrink-0" size={24} />
          <p className="text-xs text-slate-500 italic">
            এই নিরাপত্তা ব্যবস্থা নিশ্চিত করে যে কেবল অনুমোদিত ব্যক্তিরাই
            আর্থিক ড্যাশবোর্ডে প্রবেশ করতে পারবেন।
          </p>
        </div>

        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl transition-all font-bold border border-slate-700"
        >
           <FaSignOutAlt />
           লগআউট
        </button>
      </motion.div>
    </div>
  );
};

export default AwaitingApproval;
