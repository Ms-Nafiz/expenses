import React from 'react';
import { motion } from 'framer-motion';
import { FaWallet } from 'react-icons/fa';

const Loader = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute w-[300px] h-[300px] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />

      <div className="relative flex flex-col items-center justify-center">
        {/* Outer Rotating Ring with Gradient Borders */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
          className="w-20 h-20 rounded-full border-2 border-slate-800/80 border-t-indigo-500 border-r-purple-500 shadow-[0_0_30px_rgba(99,102,241,0.15)]"
        />

        {/* Center Wallet Icon with Pulsing Effect */}
        <motion.div
          animate={{
            scale: [0.95, 1.05, 0.95],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "easeInOut",
          }}
          className="absolute text-indigo-400 text-2xl"
        >
          <FaWallet />
        </motion.div>
      </div>

      {/* Title & Status */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="mt-8 text-center select-none"
      >
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent tracking-wide font-sans">
          আমার হিসাব নিকাশ
        </h2>
        <motion.p 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="text-slate-500 text-xs mt-3 font-medium tracking-widest"
        >
          তথ্য লোড হচ্ছে...
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Loader;
