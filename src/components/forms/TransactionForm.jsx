import React from "react";
import { useForm } from "react-hook-form";
import {
  FaDollarSign,
  FaTag,
  FaStickyNote,
  FaCalendarAlt,
  FaMagic,
  FaMicrophone,
  FaPaste,
  FaCog,
  FaTrash,
  FaEdit,
} from "react-icons/fa";
import { suggestCategory, parseTransactionText } from "../../ai/gemini";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateUserCategories } from "../../services/userService";
import { 
  renameTransactionCategory,
  subscribeToTransactions
} from "../../services/transactionService";
import Modal from "../layout/Modal";

const TransactionForm = ({ onSubmit, initialData, isLoading }) => {
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [smartInput, setSmartInput] = useState("");
  
  const { user, userData } = useAuth();
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [editingCatIndex, setEditingCatIndex] = useState(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  const budgets = useMemo(() => userData?.budgets || [], [userData?.budgets]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsubTx = subscribeToTransactions(user.uid, (data) => {
      setTransactions(data);
    });
    return () => unsubTx();
  }, [user]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: initialData || {
      type: "expense",
      amount: "",
      category: "Food",
      note: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const defaultCategories = [
    "Food",
    "Shopping",
    "Bills",
    "Medical",
    "Education",
    "Entertainment",
    "Transport",
    "Investment",
    "Other",
  ];

  const categories = useMemo(() => {
    const userCats = userData?.categories || [];
    const filteredDefaults = defaultCategories.filter((c) => c !== "Other");
    const uniqueCats = Array.from(new Set([...filteredDefaults, ...userCats]));
    return [...uniqueCats, "Other"];
  }, [userData?.categories]);

  const selectedCategory = watch("category");
  const noteValue = watch("note");
  const inputAmount = watch("amount");
  const inputType = watch("type");

  const budgetWarning = useMemo(() => {
    if (inputType !== "expense" || !selectedCategory || !inputAmount || isNaN(inputAmount)) {
      return null;
    }

    const budget = budgets.find((b) => b.category === selectedCategory);
    if (!budget) return null;

    const amt = parseFloat(inputAmount);
    
    // Sum existing expenses for this category in the current month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    let spent = 0;
    transactions.forEach((t) => {
      if (t.type === "expense" && t.category === selectedCategory && t.date) {
        if (initialData && t.id === initialData.id) return;
        
        const tDate = new Date(t.date);
        if (tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth) {
          spent += parseFloat(t.amount) || 0;
        }
      }
    });

    const newTotal = spent + amt;
    if (newTotal > budget.limitAmount) {
      return {
        type: "exceeded",
        msg: `⚠️ সতর্কীকরণ: এই লেনদেনটি যোগ করলে আপনার "${selectedCategory}" বাজেটের সীমা (৳${budget.limitAmount.toLocaleString()}) অতিক্রম করবে! (বর্তমান মোট খরচ: ৳${spent.toLocaleString()})`,
      };
    } else if (newTotal >= budget.limitAmount * 0.8) {
      return {
        type: "warning",
        msg: `⚠️ সতর্কীকরণ: আপনার "${selectedCategory}" ক্যাটেগরির মাসিক বাজেট ফুরিয়ে আসছে! (সীমা: ৳${budget.limitAmount.toLocaleString()}, খরচ হবে: ৳${newTotal.toLocaleString()})`,
      };
    }

    return null;
  }, [inputType, selectedCategory, inputAmount, budgets, transactions, initialData]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (noteValue && noteValue.length > 3 && !initialData) {
        setIsSuggesting(true);
        const suggestion = await suggestCategory(noteValue);
        if (suggestion && categories.includes(suggestion)) {
          setValue("category", suggestion);
        }
        setIsSuggesting(false);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [noteValue, setValue, initialData, categories]);

  const handleSmartParse = async (text) => {
    if (!text || text.length < 5) return;
    setIsParsing(true);
    const result = await parseTransactionText(text);
    if (result) {
      if (result.amount) setValue("amount", result.amount);
      if (result.type) setValue("type", result.type);
      if (result.category) setValue("category", result.category);
      if (result.note) setValue("note", result.note);
      if (result.date) setValue("date", result.date);
    }
    setIsParsing(false);
    setSmartInput("");
  };

  const startVoiceCapture = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("এই ব্রাউজারে ভয়েস রিকগনিশন সমর্থিত নয়।");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "bn-BD"; // Use Bangla
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleSmartParse(transcript);
    };
    recognition.start();
  }, []);

  const handleFormSubmit = async (data) => {
    let finalCategory = data.category;
    
    if (data.category === "Other" && data.customCategory) {
      finalCategory = data.customCategory.trim();
      
      const existingUserCats = userData?.categories || [];
      if (
        finalCategory && 
        !existingUserCats.includes(finalCategory) && 
        !defaultCategories.includes(finalCategory)
      ) {
        try {
          const newUserCats = [...existingUserCats, finalCategory];
          await updateUserCategories(user.uid, newUserCats);
        } catch (error) {
          console.error("Failed to save custom category:", error);
        }
      }
    }
    
    const finalData = {
      ...data,
      category: finalCategory,
    };
    // Remove temporary field before sending to Firebase
    delete finalData.customCategory;
    onSubmit(finalData);
  };

  const handleRenameCategory = async (oldName, index) => {
    const newName = editingCatName.trim();
    if (!newName || newName === oldName) {
      setEditingCatIndex(null);
      return;
    }
    
    const existingUserCats = userData?.categories || [];
    if (existingUserCats.includes(newName) || defaultCategories.includes(newName)) {
      alert("এই ক্যাটেগরিটি ইতিমধ্যে বিদ্যমান আছে।");
      return;
    }

    setIsActionLoading(true);
    try {
      await renameTransactionCategory(user.uid, oldName, newName);
      
      const newUserCats = [...existingUserCats];
      newUserCats[index] = newName;
      await updateUserCategories(user.uid, newUserCats);
      
      setEditingCatIndex(null);
      setEditingCatName("");
    } catch (err) {
      console.error("Failed to rename category:", err);
      alert("ক্যাটেগরি পরিবর্তন করতে ব্যর্থ হয়েছে।");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteCategory = async (catName, index) => {
    if (!confirm(`আপনি কি নিশ্চিত যে আপনি "${catName}" ক্যাটেগরি মুছতে চান? এই ক্যাটেগরির সব লেনদেন "Other" ক্যাটেগরিতে পরিবর্তিত হবে।`)) {
      return;
    }

    setIsActionLoading(true);
    try {
      await renameTransactionCategory(user.uid, catName, "Other");

      const existingUserCats = userData?.categories || [];
      const newUserCats = existingUserCats.filter((_, i) => i !== index);
      await updateUserCategories(user.uid, newUserCats);

      if (watch("category") === catName) {
        setValue("category", "Other");
      }
    } catch (err) {
      console.error("Failed to delete category:", err);
      alert("ক্যাটেগরি মুছতে ব্যর্থ হয়েছে।");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Smart AI Entry Section */}
      {!initialData && (
        <div className="bg-indigo-600/5 p-4 rounded-2xl border border-indigo-500/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <FaMagic size={12} />
              স্মার্ট এআই এন্ট্রি
            </h4>
            <button
              type="button"
              onClick={startVoiceCapture}
              className={`p-2 rounded-xl transition-all ${isListening ? "bg-rose-500 text-white animate-pulse" : "bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30"}`}
              title="ভয়েস ইনপুট"
            >
              <FaMicrophone size={14} />
            </button>
          </div>
          <div className="relative">
            <textarea
              value={smartInput}
              onChange={(e) => setSmartInput(e.target.value)}
              placeholder="এসএমএস/ব্যাংক টেক্সট বা নোট এখানে পেস্ট করুন... (যেমন: Dinner-এ 500 টাকার খরচ)"
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 focus:border-indigo-500 outline-none transition-all resize-none h-20"
            />
            {smartInput && (
              <button
                type="button"
                onClick={() => handleSmartParse(smartInput)}
                className="absolute bottom-3 right-3 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-500 transition-all flex items-center gap-1"
                disabled={isParsing}
              >
                {isParsing ? (
                  "পাঠ বিশ্লেষণ হচ্ছে..."
                ) : (
                  <>
                    <FaPaste size={10} /> বের করুন
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
      <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
        <label className="flex-1 cursor-pointer text-center">
          <input
            type="radio"
            value="expense"
            {...register("type")}
            className="hidden peer"
          />
          <div className="py-2 rounded-lg peer-checked:bg-rose-500/20 peer-checked:text-rose-400 text-slate-400 transition-all">
            খরচ
          </div>
        </label>
        <label className="flex-1 cursor-pointer text-center">
          <input
            type="radio"
            value="income"
            {...register("type")}
            className="hidden peer"
          />
          <div className="py-2 rounded-lg peer-checked:bg-emerald-500/20 peer-checked:text-emerald-400 text-slate-400 transition-all">
            আয়
          </div>
        </label>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
          ৳
        </div>
        <input
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register("amount", {
            required: "টাকার পরিমাণ আবশ্যক",
            min: 0.01,
          })}
          className={`w-full bg-slate-800/50 border ${errors.amount ? "border-rose-500" : "border-slate-700"} rounded-xl px-12 py-3 text-white focus:border-indigo-500 outline-none`}
        />
        {watch("amount") > 10000 && watch("type") === "expense" && (
          <div className="absolute -top-6 right-0 text-[10px] text-amber-400 flex items-center gap-1 font-bold animate-bounce">
            <FaMagic size={10} />
            বড় খরচ সতর্কতা!
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <FaTag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <select
            {...register("category")}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-12 py-3 text-white focus:border-indigo-500 outline-none appearance-none cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-slate-900">
                {cat}
              </option>
            ))}
          </select>
          {isSuggesting && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center space-x-1 text-indigo-400 text-xs animate-pulse">
              <FaMagic size={10} />
              <span>এআই পরামর্শ দিচ্ছে...</span>
            </div>
          )}
        </div>
        
        {user && (
          <button
            type="button"
            onClick={() => setIsManageModalOpen(true)}
            className="px-4 py-3 bg-slate-800 border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-700 text-slate-300 rounded-xl transition-all flex items-center justify-center cursor-pointer"
            title="ক্যাটেগরি পরিচালনা করুন"
          >
            <FaCog className="text-indigo-400 animate-hover-spin" />
          </button>
        )}
      </div>

      {selectedCategory === "Other" && (
        <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
          <FaTag className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
          <input
            type="text"
            placeholder="কাস্টম ক্যাটেগরি নাম"
            {...register("customCategory", {
              required: selectedCategory === "Other",
            })}
            className="w-full bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-12 py-3 text-white focus:border-indigo-500 outline-none"
          />
          {errors.customCategory && (
            <span className="text-rose-400 text-xs mt-1">
              অনুগ্রহ করে ক্যাটেগরির নাম লিখুন
            </span>
          )}
        </div>
      )}

      {budgetWarning && (
        <div className={`p-3 rounded-xl border text-xs leading-relaxed animate-in fade-in duration-300 ${
          budgetWarning.type === "exceeded" 
            ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
        }`}>
          {budgetWarning.msg}
        </div>
      )}

      <div className="relative">
        <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="date"
          {...register("date", { required: "তারিখ আবশ্যক" })}
          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-12 py-3 text-white focus:border-indigo-500 outline-none"
        />
      </div>

      <div className="relative">
        <FaStickyNote className="absolute left-4 top-4 text-slate-500" />
        <textarea
          placeholder="নোট (ঐচ্ছিক)"
          rows="3"
          {...register("note")}
          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-12 py-3 text-white focus:border-indigo-500 outline-none resize-none"
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
      >
        {isLoading
          ? "সংরক্ষণ হচ্ছে..."
          : initialData
            ? "লেনদেন আপডেট করুন"
            : "লেনদেন যোগ করুন"}
      </button>
    </form>

    <Modal
      isOpen={isManageModalOpen}
      onClose={() => {
        setIsManageModalOpen(false);
        setEditingCatIndex(null);
      }}
      title="ক্যাটেগরি পরিচালনা করুন"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-400 pb-2 border-b border-slate-800">
          এখানে আপনার তৈরি করা কাস্টম ক্যাটেগরিগুলো এডিট বা ডিলিট করতে পারেন। ডিফল্ট ক্যাটেগরিগুলো মুছে ফেলা যাবে না।
        </p>
        
        <div className="max-h-60 overflow-y-auto divide-y divide-slate-800 custom-scrollbar pr-1">
          {!userData?.categories || userData.categories.length === 0 ? (
            <p className="text-center text-slate-500 py-6 text-sm">
              কোন কাস্টম ক্যাটেগরি পাওয়া যায়নি।
            </p>
          ) : (
            userData.categories.map((cat, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-3">
                {editingCatIndex === idx ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingCatName}
                      onChange={(e) => setEditingCatName(e.target.value)}
                      className="flex-1 bg-slate-800 border border-indigo-500 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                      disabled={isActionLoading}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleRenameCategory(cat, idx)}
                      disabled={isActionLoading}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      রক্ষণ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCatIndex(null);
                        setEditingCatName("");
                      }}
                      disabled={isActionLoading}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      বাতিল
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-semibold text-slate-300">
                      {cat}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCatIndex(idx);
                          setEditingCatName(cat);
                        }}
                        disabled={isActionLoading}
                        className="p-2 text-slate-400 hover:text-indigo-400 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                        title="সম্পাদনা করুন"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat, idx)}
                        disabled={isActionLoading}
                        className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
    </>
  );
};

export default TransactionForm;
