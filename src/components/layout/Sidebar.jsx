import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FaChartPie,
  FaExchangeAlt,
  FaBrain,
  FaUser,
  FaSignOutAlt,
  FaThLarge,
  FaTimes,
  FaUserShield,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = ({ isOpen, onClose }) => {
  const { logout, userData } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Failed to log out", err);
    }
  };

  const menuItems = [
    { name: "ড্যাশবোর্ড", icon: <FaThLarge />, path: "/" },
    { name: "লেনদেন", icon: <FaExchangeAlt />, path: "/transactions" },
    { name: "রিপোর্টস", icon: <FaChartPie />, path: "/analytics" },
    { name: "এআই বিশ্লেষণ", icon: <FaBrain />, path: "/ai-insights" },
    { name: "প্রোফাইল", icon: <FaUser />, path: "/profile" },
  ];

  const adminItem = {
    name: "অ্যাডমিন প্যানেল",
    icon: <FaUserShield />,
    path: "/admin",
  };

  return (
    <div
      className={`
      fixed inset-y-0 left-0 z-50 w-64 glass-darker border-r border-slate-800 flex flex-col
      transition-transform duration-300 transform lg:translate-x-0
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
    `}
    >
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          আমার হিসাব নিকাশ
        </h1>
        <button
          onClick={onClose}
          className="lg:hidden p-2 text-slate-400 hover:text-white"
        >
          <FaTimes size={20} />
        </button>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => {
              if (window.innerWidth < 1024) onClose();
            }}
            className={({ isActive }) => `
              flex items-center space-x-3 px-4 py-3 rounded-xl transition-all
              ${
                isActive
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }
            `}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}

        {userData?.role === "admin" && (
          <NavLink
            to={adminItem.path}
            onClick={() => {
              if (window.innerWidth < 1024) onClose();
            }}
            className={({ isActive }) => `
              flex items-center space-x-3 px-4 py-3 rounded-xl transition-all mt-8
              ${
                isActive
                  ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }
            `}
          >
            <span className="text-xl">{adminItem.icon}</span>
            <span className="font-medium">{adminItem.name}</span>
          </NavLink>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all"
        >
          <FaSignOutAlt className="text-xl" />
          <span className="font-medium">লগ আউট</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
