import React, { useState, useEffect, useRef } from "react";
import Layout from "../../components/layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { subscribeToTransactions } from "../../services/transactionService";
import { getFinancialInsights, chatWithAdvisor } from "../../ai/gemini";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBrain,
  FaMagic,
  FaLightbulb,
  FaRobot,
  FaPaperPlane,
  FaUser,
} from "react-icons/fa";

const AIInsights = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [insights, setInsights] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "স্বাগতম! আমি আপনার ব্যক্তিগত AI অর্থ উপদেষ্টা। আপনার খরচ বা আয় নিয়ে যেকোনো প্রশ্ন আমাকে করতে পারেন।",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTransactions(user.uid, (data) => {
      setTransactions(data);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateInsights = async () => {
    if (transactions.length === 0) return;
    try {
      setLoading(true);
      const result = await getFinancialInsights(transactions);
      setInsights(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isChatting) return;

    const userMsg = { role: "user", text: inputValue };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsChatting(true);

    try {
      const response = await chatWithAdvisor(
        messages,
        inputValue,
        transactions,
      );
      setMessages((prev) => [...prev, { role: "assistant", text: response }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "দুঃখিত, প্রযুক্তিগত সমস্যার কারণে আমি উত্তর দিতে পারছি না।",
        },
      ]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <FaBrain className="text-indigo-400" />
          এআই আর্থিক সহকারী
        </h1>
        <p className="text-slate-400 mt-2">
          আপনার খরচের ভিত্তিতে স্মার্ট বিশ্লেষণ ও পরামর্শ পান।
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:h-[calc(100vh-250px)]">
        {/* Left Column: AI Insights */}
        <div className="lg:col-span-1 space-y-6 flex flex-col h-full">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass p-6 rounded-3xl flex-1 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FaMagic className="text-purple-400" />
                সর্বশেষ বিশ্লেষণ
              </h3>
              <button
                onClick={generateInsights}
                disabled={loading || transactions.length === 0}
                className="bg-indigo-600/20 text-indigo-300 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-600/30 transition-all disabled:opacity-50"
              >
                {loading ? "বিশ্লেষণ হচ্ছে..." : "আপডেট"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {insights ? (
                <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/50 whitespace-pre-wrap text-slate-300 text-sm leading-relaxed">
                  {insights}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-slate-600">
                  <FaRobot className="text-5xl opacity-20" />
                  <p className="text-sm">এআই বিশ্লেষণের জন্য "আপডেট" চাপুন।</p>
                </div>
              )}
            </div>
          </motion.div>

          <div className="glass p-6 rounded-3xl border border-indigo-500/10">
            <h4 className="font-bold text-indigo-300 mb-3 flex items-center gap-2 text-sm">
              <FaLightbulb />
              Quick Tips
            </h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex gap-2">
                <span className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                বড় খরচগুলো ট্র্যাক করতে ডেসক্রিপশন ব্যবহার করুন।
              </li>
              <li className="flex gap-2">
                <span className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                বাজেট নিয়ন্ত্রণে রাখতে AI চ্যাটের সাহায্য নিন।
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: AI Advisor Chat */}
        <div className="lg:col-span-2 h-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass flex flex-col h-full rounded-3xl overflow-hidden border border-slate-800"
          >
            <div className="p-6 border-b border-slate-800 bg-slate-800/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <FaRobot className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    আর্থিক পরামর্শকারী চ্যাট
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] text-emerald-500 font-medium uppercase tracking-wider">
                      এআই অনলাইনে
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex gap-3 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs ${
                          msg.role === "user" ? "bg-indigo-600" : "bg-slate-800"
                        }`}
                      >
                        {msg.role === "user" ? <FaUser /> : <FaRobot />}
                      </div>
                      <div
                        className={`p-4 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-indigo-600 text-white rounded-tr-none"
                            : "bg-slate-800/50 text-slate-300 border border-slate-700/50 rounded-tl-none"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isChatting && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-slate-800/50 p-4 rounded-2xl rounded-tl-none border border-slate-700/50 flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-slate-800 bg-slate-900/50"
            >
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="আপনার অর্থ সংক্রান্ত প্রশ্ন জিজ্ঞাসা করুন..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 pr-16 text-white focus:border-indigo-500 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isChatting}
                  className="absolute right-2 p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all disabled:opacity-50"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default AIInsights;
