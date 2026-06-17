import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle } from 'react-icons/fa';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "নিশ্চিত করুন", cancelText = "বাতিল", type = "danger" }) => {
  if (!isOpen) return null;

  const typeColors = {
    danger: "bg-rose-500",
    warning: "bg-amber-500",
    info: "bg-indigo-500"
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-full h-1 ${typeColors[type]}`} />
            
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                type === 'danger' ? 'bg-rose-500/10 text-rose-500' : 
                type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-500'
              }`}>
                <FaExclamationTriangle size={32} />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">{message}</p>
              
              <div className="flex gap-4 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 px-6 py-3 rounded-2xl text-white font-medium transition-all shadow-lg ${
                    type === 'danger' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20' : 
                    type === 'warning' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
