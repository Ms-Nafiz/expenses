import React, { useState, useEffect, useMemo } from "react";
import Layout from "../../components/layout/Layout";
import Modal from "../../components/layout/Modal";
import ConfirmModal from "../../components/common/ConfirmModal";
import TransactionForm from "../../components/forms/TransactionForm";
import { useAuth } from "../../context/AuthContext";
import {
  addTransaction,
  updateTransaction,
  subscribeToTransactions,
  deleteTransaction,
  subscribeToBudgets,
  addBudget,
  updateBudget,
  deleteBudget,
  subscribeToRecurringConfigs,
  addRecurringConfig,
  deleteRecurringConfig,
} from "../../services/transactionService";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaSearch,
  FaFilter,
  FaFileExcel,
  FaFilePdf,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { format } from "date-fns";
import { exportToExcel, exportToPDF } from "../../utils/exportUtils";

const Transactions = () => {
  const { user, userData } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const budgets = useMemo(() => userData?.budgets || [], [userData?.budgets]);
  const recurringConfigs = useMemo(() => userData?.recurringConfigs || [], [userData?.recurringConfigs]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    id: null,
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [activeTab, setActiveTab] = useState("list"); // "list", "summary", "budget", "recurring"
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());

  // Budget Modal State
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [budgetCategory, setBudgetCategory] = useState("Food");
  const [budgetLimit, setBudgetLimit] = useState("");

  // Recurring Setup State
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [recTitle, setRecTitle] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recType, setRecType] = useState("expense");
  const [recCategory, setRecCategory] = useState("Food");
  const [recDay, setRecDay] = useState("1");

  const defaultCategories = useMemo(() => [
    "Food",
    "Shopping",
    "Bills",
    "Medical",
    "Education",
    "Entertainment",
    "Transport",
    "Investment",
    "Other",
  ], []);

  const categories = useMemo(() => {
    const userCats = userData?.categories || [];
    const filteredDefaults = defaultCategories.filter((c) => c !== "Other");
    const uniqueCats = Array.from(new Set([...filteredDefaults, ...userCats]));
    return [...uniqueCats, "Other"];
  }, [userData?.categories, defaultCategories]);

  useEffect(() => {
    if (!user) return;
    const unsubTx = subscribeToTransactions(user.uid, (data) => {
      setTransactions(data);
    });
    return () => unsubTx();
  }, [user]);

  // Budget Handlers
  const handleOpenBudgetModal = (budget = null) => {
    if (budget) {
      setEditingBudget(budget);
      setBudgetCategory(budget.category);
      setBudgetLimit(budget.limitAmount);
    } else {
      setEditingBudget(null);
      setBudgetCategory(categories[0] || "Food");
      setBudgetLimit("");
    }
    setIsBudgetModalOpen(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!budgetCategory || !budgetLimit) return;
    
    setLoading(true);
    try {
      const existingBudgets = userData?.budgets || [];
      let newBudgets = [];
      
      if (editingBudget) {
        newBudgets = existingBudgets.map((b) => 
          b.category === editingBudget.category 
            ? { ...b, limitAmount: parseFloat(budgetLimit) }
            : b
        );
      } else {
        const exists = existingBudgets.some((b) => b.category === budgetCategory);
        if (exists) {
          alert("এই ক্যাটেগরির জন্য ইতিমধ্যে বাজেট সেট করা আছে।");
          setLoading(false);
          return;
        }
        newBudgets = [...existingBudgets, { 
          category: budgetCategory, 
          limitAmount: parseFloat(budgetLimit) 
        }];
      }
      
      const { updateUserBudgets } = await import("../../services/userService");
      await updateUserBudgets(user.uid, newBudgets);
      setIsBudgetModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("বাজেট সংরক্ষণ করতে ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async (categoryToDelete) => {
    if (!confirm("আপনি কি নিশ্চিত যে আপনি এই বাজেটটি মুছে ফেলতে চান?")) return;
    setLoading(true);
    try {
      const existingBudgets = userData?.budgets || [];
      const newBudgets = existingBudgets.filter((b) => b.category !== categoryToDelete);
      
      const { updateUserBudgets } = await import("../../services/userService");
      await updateUserBudgets(user.uid, newBudgets);
    } catch (err) {
      console.error(err);
      alert("বাজেট মুছতে ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  // Recurring Handlers
  const handleSaveRecurring = async (e) => {
    e.preventDefault();
    if (!recTitle || !recAmount || !recDay) return;

    setLoading(true);
    try {
      const existingRecs = userData?.recurringConfigs || [];
      const newRecs = [
        ...existingRecs,
        {
          id: Date.now().toString(),
          title: recTitle,
          amount: parseFloat(recAmount),
          type: recType,
          category: recCategory,
          dayOfMonth: parseInt(recDay),
          lastProcessedMonth: "",
        }
      ];
      
      const { updateUserRecurringConfigs } = await import("../../services/userService");
      await updateUserRecurringConfigs(user.uid, newRecs);
      setIsRecurringModalOpen(false);
      setRecTitle("");
      setRecAmount("");
      setRecDay("1");
    } catch (err) {
      console.error(err);
      alert("পুনরাবৃত্তিমূলক লেনদেন সংরক্ষণ করতে ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecurring = async (configId) => {
    if (!confirm("আপনি কি নিশ্চিত যে আপনি এই পুনরাবৃত্তিমূলক লেনদেনটি মুছে ফেলতে চান?")) return;
    setLoading(true);
    try {
      const existingRecs = userData?.recurringConfigs || [];
      const newRecs = existingRecs.filter((r) => r.id !== configId);
      
      const { updateUserRecurringConfigs } = await import("../../services/userService");
      await updateUserRecurringConfigs(user.uid, newRecs);
    } catch (err) {
      console.error(err);
      alert("মুছে ফেলতে ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (data) => {
    try {
      setLoading(true);
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, data);
      } else {
        await addTransaction(user.uid, data);
      }
      handleCloseModal();
    } catch (err) {
      console.error(err);
      alert(`Failed to ${editingTransaction ? "update" : "add"} transaction`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDelete = (id) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const executeDelete = async () => {
    try {
      setLoading(true);
      await deleteTransaction(confirmDelete.id);
      setConfirmDelete({ isOpen: false, id: null });
    } catch (err) {
      console.error(err);
      alert("Failed to delete transaction");
    } finally {
      setLoading(false);
    }
  };

  const currentMonthTransactions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    return transactions.filter((t) => {
      if (!t.date) return false;
      const tDate = new Date(t.date);
      return (
        tDate.getFullYear() === currentYear &&
        tDate.getMonth() === currentMonth
      );
    });
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return currentMonthTransactions.filter((t) => {
      const matchesSearch =
        t.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || t.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [currentMonthTransactions, searchTerm, filterType]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const availableYears = useMemo(() => {
    const years = new Set([new Date().getFullYear()]);
    transactions.forEach((t) => {
      if (t.date) {
        years.add(new Date(t.date).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const monthlySummaries = useMemo(() => {
    const groups = {}; // key: YYYY-MM -> { income: 0, expense: 0 }
    
    transactions.forEach((t) => {
      if (!t.date) return;
      const date = new Date(t.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${month.toString().padStart(2, "0")}`;
      
      if (!groups[key]) {
        groups[key] = { income: 0, expense: 0 };
      }
      
      const amt = parseFloat(t.amount) || 0;
      if (t.type === "income") {
        groups[key].income += amt;
      } else {
        groups[key].expense += amt;
      }
    });

    const banglaMonths = [
      "জানুয়ারি",
      "ফেব্রুয়ারি",
      "মার্চ",
      "এপ্রিল",
      "মে",
      "জুন",
      "জুলাই",
      "আগস্ট",
      "সেপ্টেম্বর",
      "অক্টোবর",
      "নভেম্বর",
      "ডিসেম্বর",
    ];

    const summaries = [];
    const selectedYearInt = parseInt(summaryYear);

    for (let m = 0; m < 12; m++) {
      const currentKey = `${selectedYearInt}-${m.toString().padStart(2, "0")}`;
      const currentData = groups[currentKey] || { income: 0, expense: 0 };
      const currentBalance = currentData.income - currentData.expense;

      // Previous month
      const prevMonthVal = m === 0 ? 11 : m - 1;
      const prevYearVal = m === 0 ? selectedYearInt - 1 : selectedYearInt;
      const prevKey = `${prevYearVal}-${prevMonthVal.toString().padStart(2, "0")}`;
      const prevData = groups[prevKey] || { income: 0, expense: 0 };
      const prevBalance = prevData.income - prevData.expense;

      // Income % Change
      let incomeChangePercent = 0;
      if (prevData.income > 0) {
        incomeChangePercent = ((currentData.income - prevData.income) / prevData.income) * 100;
      } else if (currentData.income > 0) {
        incomeChangePercent = 100;
      }

      // Expense % Change
      let expenseChangePercent = 0;
      if (prevData.expense > 0) {
        expenseChangePercent = ((currentData.expense - prevData.expense) / prevData.expense) * 100;
      } else if (currentData.expense > 0) {
        expenseChangePercent = 100;
      }

      // Balance Difference and % Change
      const balanceDiff = currentBalance - prevBalance;
      let balanceChangePercent = 0;
      if (prevBalance !== 0) {
        balanceChangePercent = (balanceDiff / Math.abs(prevBalance)) * 100;
      } else if (currentBalance !== 0) {
        balanceChangePercent = 100;
      }

      summaries.push({
        monthIndex: m,
        monthName: banglaMonths[m],
        income: currentData.income,
        expense: currentData.expense,
        balance: currentBalance,
        prevIncome: prevData.income,
        prevExpense: prevData.expense,
        prevBalance: prevBalance,
        incomeChangePercent,
        expenseChangePercent,
        balanceDiff,
        balanceChangePercent,
      });
    }

    return summaries;
  }, [transactions, summaryYear]);

  const yearlyTotals = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let monthsWithData = 0;

    monthlySummaries.forEach((m) => {
      totalIncome += m.income;
      totalExpense += m.expense;
      if (m.income > 0 || m.expense > 0) {
        monthsWithData++;
      }
    });

    const yearlyBalance = totalIncome - totalExpense;
    const avgMonthlyBalance = monthsWithData > 0 ? yearlyBalance / monthsWithData : 0;

    return {
      income: totalIncome,
      expense: totalExpense,
      balance: yearlyBalance,
      avgBalance: avgMonthlyBalance,
    };
  }, [monthlySummaries]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((t) => {
      const amt = parseFloat(t.amount) || 0;
      if (t.type === "income") income += amt;
      else expense += amt;
    });
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  const categoryExpensesForCurrentMonth = useMemo(() => {
    const sums = {};
    currentMonthTransactions.forEach((t) => {
      if (t.type === "expense") {
        const amt = parseFloat(t.amount) || 0;
        sums[t.category] = (sums[t.category] || 0) + amt;
      }
    });
    return sums;
  }, [currentMonthTransactions]);

  const budgetSummary = useMemo(() => {
    let totalLimit = 0;
    let totalSpent = 0;

    budgets.forEach((b) => {
      totalLimit += b.limitAmount || 0;
      totalSpent += categoryExpensesForCurrentMonth[b.category] || 0;
    });

    const percent = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;
    const remaining = Math.max(totalLimit - totalSpent, 0);

    return {
      totalLimit,
      totalSpent,
      percent,
      remaining
    };
  }, [budgets, categoryExpensesForCurrentMonth]);

  const SummaryCard = ({ title, amount, type }) => (
    <div className="glass p-4 rounded-2xl border border-slate-800 flex-1">
      <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">
        {title}
      </p>
      <p
        className={`text-2xl font-bold mt-1 ${
          type === "income"
            ? "text-emerald-400"
            : type === "expense"
              ? "text-rose-400"
              : "text-indigo-400"
        }`}
      >
        {type === "balance" && amount < 0 ? "-" : ""}৳
        {Math.abs(amount).toLocaleString()}
      </p>
    </div>
  );

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">লেনদেন</h1>
          <p className="text-slate-400">
            আপনার আর্থিক নথি দেখুন এবং পরিচালনা করুন।
          </p>
        </div>
        {activeTab === "list" && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => exportToExcel(currentMonthTransactions)}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl transition-all border border-slate-700"
            >
              <FaFileExcel className="text-emerald-500" />
              <span className="hidden md:inline">এক্সেল</span>
            </button>
            <button
              onClick={() => exportToPDF(currentMonthTransactions)}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl transition-all border border-slate-700"
            >
              <FaFilePdf className="text-rose-500" />
              <span className="hidden md:inline">পিডিএফ</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all"
            >
              <FaPlus />
              <span className="hidden sm:inline">লেনদেন যোগ করুন</span>
              <span className="sm:hidden">যোগ</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/80 mb-6 gap-2 overflow-x-auto custom-scrollbar whitespace-nowrap pb-1">
        <button
          onClick={() => setActiveTab("list")}
          className={`pb-3 px-4 text-sm font-semibold transition-all relative cursor-pointer ${
            activeTab === "list"
              ? "text-indigo-400 border-b-2 border-indigo-500"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          লেনদেন তালিকা
        </button>
        <button
          onClick={() => setActiveTab("summary")}
          className={`pb-3 px-4 text-sm font-semibold transition-all relative cursor-pointer ${
            activeTab === "summary"
              ? "text-indigo-400 border-b-2 border-indigo-500"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          মাসিক সারসংক্ষেপ
        </button>
        <button
          onClick={() => setActiveTab("budget")}
          className={`pb-3 px-4 text-sm font-semibold transition-all relative cursor-pointer ${
            activeTab === "budget"
              ? "text-indigo-400 border-b-2 border-indigo-500"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          বাজেট নিয়ন্ত্রণ
        </button>
        <button
          onClick={() => setActiveTab("recurring")}
          className={`pb-3 px-4 text-sm font-semibold transition-all relative cursor-pointer ${
            activeTab === "recurring"
              ? "text-indigo-400 border-b-2 border-indigo-500"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          পুনরাবৃত্তিমূলক লেনদেন
        </button>
      </div>

      {activeTab === "list" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <SummaryCard title="মোট আয় (চলতি মাস)" amount={totals.income} type="income" />
            <SummaryCard title="মোট খরচ (চলতি মাস)" amount={totals.expense} type="expense" />
            <SummaryCard
              title="নেট ব্যালান্স (চলতি মাস)"
              amount={totals.balance}
              type="balance"
            />
          </div>

          <div className="glass rounded-3xl overflow-hidden border border-slate-800">
            <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="নোট বা বিভাগে খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-12 py-2.5 text-white focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl px-12 py-2.5 text-white focus:border-indigo-500 outline-none appearance-none transition-all"
                  >
                    <option value="all">সব ধরন</option>
                    <option value="income">শুধু আয়</option>
                    <option value="expense">শুধু খরচ</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="lg:hidden divide-y divide-slate-800">
              {paginatedTransactions.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full ${t.type === "income" ? "bg-emerald-500" : "bg-rose-500"}`}
                      ></span>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                        {t.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-white truncate">
                      {t.note || "বিস্তারিত নেই"}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {t.date
                        ? format(new Date(t.date), "MMM dd, yyyy")
                        : "অনুপলব্ধ"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold mb-2 ${t.type === "income" ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      {t.type === "income" ? "+" : "-"}৳
                      {parseFloat(t.amount).toLocaleString()}
                    </p>
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleOpenEditModal(t)}
                        className="p-2 text-slate-500 hover:text-indigo-400 bg-slate-800/50 rounded-lg"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 bg-slate-800/50 rounded-lg"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="hidden lg:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-800/50 text-slate-400 text-sm uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">তারিখ</th>
                    <th className="px-6 py-4 font-medium">বিভাগ</th>
                    <th className="px-6 py-4 font-medium">বর্ণনা</th>
                    <th className="px-6 py-4 font-medium">পরিমাণ</th>
                    <th className="px-6 py-4 font-medium text-right">কর্ম</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <AnimatePresence>
                    {paginatedTransactions.map((t) => (
                      <motion.tr
                        key={t.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-slate-800/30 transition-all group"
                      >
                        <td className="px-6 py-4 text-slate-300">
                          {t.date
                            ? format(new Date(t.date), "MMM dd, yyyy")
                            : "অনুপলব্ধ"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-800 text-indigo-300 px-3 py-1 rounded-full text-xs font-medium border border-indigo-500/20">
                            {t.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 truncate max-w-xs">
                          {t.note || "-"}
                        </td>
                        <td
                          className={`px-6 py-4 font-bold ${t.type === "income" ? "text-emerald-400" : "text-rose-400"}`}
                        >
                          {t.type === "income" ? "+" : "-"}৳
                          {parseFloat(t.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-right space-x-1 sm:space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(t)}
                            className="p-2 text-slate-400 hover:text-indigo-400 transition-all lg:opacity-0 lg:group-hover:opacity-100"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-2 text-slate-400 hover:text-rose-400 transition-all lg:opacity-0 lg:group-hover:opacity-100"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {filteredTransactions.length === 0 && (
              <div className="px-6 py-12 text-center text-slate-500">
                কোন লেনদেন পাওয়া যায়নি।
              </div>
            )}

            {filteredTransactions.length > 0 && (
              <div className="p-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/10">
                <p className="text-slate-400 text-xs sm:text-sm font-medium">
                  {filteredTransactions.length} টি লেনদেনের মধ্যে {" "}
                  <span className="text-indigo-400 font-semibold">
                    {(currentPage - 1) * itemsPerPage + 1}-
                    {Math.min(currentPage * itemsPerPage, filteredTransactions.length)}
                  </span>{" "}
                  টি দেখানো হচ্ছে
                </p>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:hover:bg-slate-800/80 disabled:hover:text-slate-400 disabled:cursor-not-allowed transition-all text-slate-300"
                  >
                    <FaChevronLeft size={12} />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                            currentPage === page
                              ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                              : "bg-slate-800/40 border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800 text-slate-300"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    }
                    
                    if (page === currentPage - 2 && page > 1) {
                      return (
                        <span key="dots-prev" className="text-slate-600 px-1 text-xs select-none">
                          ...
                        </span>
                      );
                    }
                    
                    if (page === currentPage + 2 && page < totalPages) {
                      return (
                        <span key="dots-next" className="text-slate-600 px-1 text-xs select-none">
                          ...
                        </span>
                      );
                    }
                    
                    return null;
                  })}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:hover:bg-slate-800/80 disabled:hover:text-slate-400 disabled:cursor-not-allowed transition-all text-slate-300"
                  >
                    <FaChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "summary" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <SummaryCard title="বাৎসরিক মোট আয়" amount={yearlyTotals.income} type="income" />
            <SummaryCard title="বাৎসরিক মোট খরচ" amount={yearlyTotals.expense} type="expense" />
            <SummaryCard
              title="গড় মাসিক সঞ্চয়"
              amount={yearlyTotals.avgBalance}
              type="balance"
            />
          </div>

          <div className="glass rounded-3xl overflow-hidden border border-slate-800 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">মাসিক ভিত্তিক আর্থিক প্রতিবেদন</h3>
                <p className="text-sm text-slate-400 mt-1">বিগত মাসের সাথে তুলনা এবং আয়-ব্যয়ের তুলনামূলক বিশ্লেষণ।</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base text-slate-400 font-medium">বছর নির্বাচন করুন:</span>
                <select
                  value={summaryYear}
                  onChange={(e) => setSummaryYear(parseInt(e.target.value))}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-base text-white focus:border-indigo-500 outline-none transition-all cursor-pointer"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-800/50 text-slate-400 text-base uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">মাস</th>
                    <th className="px-6 py-4 font-medium">মোট আয় (পূর্ববর্তী মাস তুলনা)</th>
                    <th className="px-6 py-4 font-medium">মোট খরচ (পূর্ববর্তী মাস তুলনা)</th>
                    <th className="px-6 py-4 font-medium">নেট ব্যালান্স (পার্থক্য)</th>
                    <th className="px-6 py-4 font-medium text-right">অবস্থা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {monthlySummaries.map((m) => {
                    const balanceDiffSymbol = m.balanceDiff >= 0 ? "+" : "-";
                    const isIncomeUp = m.incomeChangePercent >= 0;
                    const isExpenseUp = m.expenseChangePercent >= 0;
                    
                    return (
                      <tr key={m.monthIndex} className="hover:bg-slate-800/20 transition-all">
                        <td className="px-6 py-4 text-lg font-bold text-slate-200">
                          {m.monthName}
                        </td>
                        
                        {/* Income */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-base text-slate-300 font-medium">৳{m.income.toLocaleString()}</span>
                            {m.income > 0 && m.prevIncome > 0 && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                isIncomeUp ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                              }`}>
                                {isIncomeUp ? "↑" : "↓"} {Math.abs(m.incomeChangePercent).toFixed(1)}%
                              </span>
                            )}
                            {m.income > 0 && m.prevIncome === 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                নতুন আয়
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Expense */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-base text-slate-300 font-medium">৳{m.expense.toLocaleString()}</span>
                            {m.expense > 0 && m.prevExpense > 0 && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                !isExpenseUp ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                              }`}>
                                {isExpenseUp ? "↑" : "↓"} {Math.abs(m.expenseChangePercent).toFixed(1)}%
                              </span>
                            )}
                            {m.expense > 0 && m.prevExpense === 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/20">
                                নতুন খরচ
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Balance & Diff */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className={`text-lg font-bold ${m.balance >= 0 ? "text-indigo-400" : "text-rose-400"}`}>
                              ৳{m.balance.toLocaleString()}
                            </span>
                            {m.balanceDiff !== 0 && (
                              <span className={`text-xs font-medium ${m.balanceDiff >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                ({balanceDiffSymbol}৳{Math.abs(m.balanceDiff).toLocaleString()})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4 text-right">
                          <span className={`text-sm px-3 py-1 rounded-full font-semibold border ${
                            m.balance > 0 
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" 
                              : m.balance < 0 
                                ? "bg-rose-500/15 text-rose-400 border-rose-500/20" 
                                : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}>
                            {m.balance > 0 ? "সঞ্চয়" : m.balance < 0 ? "ঘাটতি" : "সমতা"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="lg:hidden divide-y divide-slate-800">
              {monthlySummaries.map((m) => {
                const balanceDiffSymbol = m.balanceDiff >= 0 ? "+" : "-";
                const isIncomeUp = m.incomeChangePercent >= 0;
                const isExpenseUp = m.expenseChangePercent >= 0;

                return (
                  <div key={m.monthIndex} className="py-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-lg text-slate-200">{m.monthName}</h4>
                      <span className={`text-sm px-3 py-1 rounded-full font-semibold border ${
                        m.balance > 0 
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" 
                          : m.balance < 0 
                            ? "bg-rose-500/15 text-rose-400 border-rose-500/20" 
                            : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}>
                        {m.balance > 0 ? "সঞ্চয়" : m.balance < 0 ? "ঘাটতি" : "সমতা"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-base bg-slate-900/25 p-3 rounded-2xl border border-slate-800/50">
                      {/* Income Info */}
                      <div>
                        <p className="text-sm text-slate-500">মোট আয়</p>
                        <p className="text-base font-semibold text-slate-300 mt-0.5">৳{m.income.toLocaleString()}</p>
                        {m.income > 0 && m.prevIncome > 0 && (
                          <span className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded-full font-bold mt-1 ${
                            isIncomeUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {isIncomeUp ? "↑" : "↓"} {Math.abs(m.incomeChangePercent).toFixed(0)}%
                          </span>
                        )}
                        {m.income > 0 && m.prevIncome === 0 && (
                          <span className="inline-flex text-xs px-1.5 py-0.5 rounded-full font-bold mt-1 bg-emerald-500/10 text-emerald-400">
                            নতুন আয়
                          </span>
                        )}
                      </div>

                      {/* Expense Info */}
                      <div>
                        <p className="text-sm text-slate-500">মোট খরচ</p>
                        <p className="text-base font-semibold text-slate-300 mt-0.5">৳{m.expense.toLocaleString()}</p>
                        {m.expense > 0 && m.prevExpense > 0 && (
                          <span className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded-full font-bold mt-1 ${
                            !isExpenseUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {isExpenseUp ? "↑" : "↓"} {Math.abs(m.expenseChangePercent).toFixed(0)}%
                          </span>
                        )}
                        {m.expense > 0 && m.prevExpense === 0 && (
                          <span className="inline-flex text-xs px-1.5 py-0.5 rounded-full font-bold mt-1 bg-rose-500/10 text-rose-400">
                            নতুন খরচ
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-base px-1">
                      <span className="text-slate-400">নেট ব্যালান্স</span>
                      <div className="text-right">
                        <span className={`text-lg font-bold ${m.balance >= 0 ? "text-indigo-400" : "text-rose-400"}`}>
                          ৳{m.balance.toLocaleString()}
                        </span>
                        {m.balanceDiff !== 0 && (
                          <span className={`block text-xs font-medium ${m.balanceDiff >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            ({balanceDiffSymbol}৳{Math.abs(m.balanceDiff).toLocaleString()})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {activeTab === "budget" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-slate-200">মাসিক বাজেট নিয়ন্ত্রণ</h3>
              <p className="text-sm text-slate-400">আপনার ক্যাটেগরি ভিত্তিক খরচের বাজেট সীমা পরিচালনা করুন।</p>
            </div>
            <button
              onClick={() => handleOpenBudgetModal()}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer text-sm font-semibold"
            >
              <FaPlus size={12} />
              <span>বাজেট সেট করুন</span>
            </button>
          </div>

          {/* Budget Summary Overview */}
          {budgets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 glass rounded-3xl border border-slate-800 bg-slate-900/10">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">মোট বাজেট সীমা</span>
                <span className="text-2xl font-bold text-slate-100">৳{budgetSummary.totalLimit.toLocaleString()}</span>
              </div>
              
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">মোট বাজেটভুক্ত খরচ</span>
                <span className="text-2xl font-bold text-indigo-400">৳{budgetSummary.totalSpent.toLocaleString()}</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">অবশিষ্ট বাজেট</span>
                <span className="text-2xl font-bold text-emerald-400">৳{budgetSummary.remaining.toLocaleString()}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-400 uppercase tracking-wider">বাজেট ব্যবহার</span>
                  <span className={budgetSummary.percent > 90 ? "text-rose-400" : budgetSummary.percent > 70 ? "text-amber-400" : "text-emerald-400"}>
                    {budgetSummary.percent}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      budgetSummary.percent > 90 ? "bg-rose-500" : budgetSummary.percent > 70 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(budgetSummary.percent, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.filter(c => c !== "Other").map((cat) => {
              const budgetObj = budgets.find((b) => b.category === cat);
              const spent = categoryExpensesForCurrentMonth[cat] || 0;
              
              if (!budgetObj) {
                return (
                  <div key={cat} className="glass p-6 rounded-3xl border border-slate-800/80 flex flex-col justify-between min-h-[160px] space-y-3">
                    <div>
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-300 text-lg">{cat}</h4>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          বাজেট নেই
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        চলতি মাসের খরচ: <span className="font-semibold text-slate-200">৳{spent.toLocaleString()}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setBudgetCategory(cat);
                        setBudgetLimit("");
                        setEditingBudget(null);
                        setIsBudgetModalOpen(true);
                      }}
                      className="w-full py-2 bg-slate-800/80 hover:bg-indigo-600/20 border border-slate-700 hover:border-indigo-500/30 text-slate-300 hover:text-indigo-400 rounded-xl transition-all text-xs font-semibold cursor-pointer"
                    >
                      + বাজেট সেট করুন
                    </button>
                  </div>
                );
              }

              const limit = budgetObj.limitAmount;
              const percent = Math.round((spent / limit) * 100);
              const remaining = Math.max(limit - spent, 0);

              let barColor = "bg-emerald-500";
              let textColor = "text-emerald-400";
              let bgColor = "bg-emerald-500/10 border-emerald-500/20";
              
              if (percent > 90) {
                barColor = "bg-rose-500";
                textColor = "text-rose-400";
                bgColor = "bg-rose-500/10 border-rose-500/20";
              } else if (percent > 70) {
                barColor = "bg-amber-500";
                textColor = "text-amber-400";
                bgColor = "bg-amber-500/10 border-amber-500/20";
              }

              return (
                <div key={cat} className="glass p-6 rounded-3xl border border-slate-800/80 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-300 text-lg">{cat}</h4>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenBudgetModal(budgetObj)}
                        className="p-2 text-slate-400 hover:text-indigo-400 bg-slate-800/50 hover:bg-slate-800 rounded-lg cursor-pointer transition-all"
                        title="সম্পাদনা করুন"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteBudget(budgetObj.category)}
                        className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800/50 hover:bg-slate-800 rounded-lg cursor-pointer transition-all"
                        title="মুছে ফেলুন"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-slate-400">
                        বাজেট: ৳{limit.toLocaleString()} | খরচ: ৳{spent.toLocaleString()}
                      </span>
                      <span className={textColor}>{percent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`${barColor} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className={`text-xs p-2 rounded-xl border flex justify-between items-center ${bgColor}`}>
                    <span>বাকি বাজেট:</span>
                    <span className="font-bold">৳{remaining.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "recurring" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-slate-200">পুনরাবৃত্তিমূলক লেনদেন (Subscriptions)</h3>
              <p className="text-sm text-slate-400">প্রতি মাসে স্বয়ংক্রিয়ভাবে লেনদেন করার জন্য সেটআপ করুন।</p>
            </div>
            <button
              onClick={() => setIsRecurringModalOpen(true)}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer text-sm font-semibold"
            >
              <FaPlus size={12} />
              <span>নতুন এন্ট্রি যোগ করুন</span>
            </button>
          </div>

          <div className="glass rounded-3xl border border-slate-800/80 overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-sm font-semibold bg-slate-900/30">
                    <th className="px-6 py-4">লেনদেন শিরোনাম</th>
                    <th className="px-6 py-4">ক্যাটেগরি</th>
                    <th className="px-6 py-4">পরিমাণ</th>
                    <th className="px-6 py-4">ধরন</th>
                    <th className="px-6 py-4">মাসের দিন</th>
                    <th className="px-6 py-4">সর্বশেষ প্রসেসড মাস</th>
                    <th className="px-6 py-4 text-right">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-sm">
                  {recurringConfigs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-slate-500">
                        কোন পুনরাবৃত্তিমূলক লেনদেন সেটআপ করা নেই।
                      </td>
                    </tr>
                  ) : (
                    recurringConfigs.map((config) => (
                      <tr key={config.id} className="hover:bg-slate-900/10 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-200">{config.title}</td>
                        <td className="px-6 py-4 text-slate-400">{config.category}</td>
                        <td className="px-6 py-4 font-bold text-slate-200">৳{config.amount.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                            config.type === "income" 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}>
                            {config.type === "income" ? "আয়" : "খরচ"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{config.dayOfMonth} তারিখ</td>
                        <td className="px-6 py-4 text-slate-500 font-semibold">{config.lastProcessedMonth || "কখনো নয়"}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteRecurring(config.id)}
                            className="p-2 text-slate-500 hover:text-rose-400 bg-slate-800/50 hover:bg-slate-800 rounded-lg cursor-pointer transition-all"
                            title="মুছে ফেলুন"
                          >
                            <FaTrash size={12} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="lg:hidden divide-y divide-slate-800/60 p-4 space-y-4">
              {recurringConfigs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  কোন পুনরাবৃত্তিমূলক লেনদেন সেটআপ করা নেই।
                </div>
              ) : (
                recurringConfigs.map((config) => (
                  <div key={config.id} className="py-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-200 text-base">{config.title}</h4>
                        <span className="text-xs text-slate-500">{config.category}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteRecurring(config.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 bg-slate-800/50 hover:bg-slate-800 rounded-lg cursor-pointer transition-all"
                        title="মুছে ফেলুন"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-300">৳{config.amount.toLocaleString()}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                        config.type === "income" 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}>
                        {config.type === "income" ? "আয়" : "খরচ"}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-slate-500">
                      <span>মাসের দিন: {config.dayOfMonth} তারিখ</span>
                      <span>সর্বশেষ প্রসেসড: {config.lastProcessedMonth || "কখনো নয়"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Budget Add/Edit Modal */}
      <Modal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        title={editingBudget ? "মাসিক বাজেট সংশোধন" : "নতুন মাসিক বাজেট সেট করুন"}
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-semibold block">ক্যাটেগরি</label>
            <select
              value={budgetCategory}
              onChange={(e) => setBudgetCategory(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none cursor-pointer"
            >
              {categories.filter(c => c !== "Other").map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-semibold block">বাজেট সীমা (৳)</label>
            <input
              type="number"
              required
              min="1"
              value={budgetLimit}
              onChange={(e) => setBudgetLimit(e.target.value)}
              placeholder="5000"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer mt-2 text-sm"
          >
            {loading ? "সংরক্ষণ হচ্ছে..." : "বাজেট সংরক্ষণ করুন"}
          </button>
        </form>
      </Modal>

      {/* Recurring Add Modal */}
      <Modal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        title="নতুন পুনরাবৃত্তিমূলক লেনদেন যোগ করুন"
      >
        <form onSubmit={handleSaveRecurring} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-semibold block">লেনদেনের নাম</label>
            <input
              type="text"
              required
              value={recTitle}
              onChange={(e) => setRecTitle(e.target.value)}
              placeholder="যেমন: ওয়াইফাই বিল, ডিপিএস, বাসা ভাড়া"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold block">টাকার পরিমাণ (৳)</label>
              <input
                type="number"
                required
                min="1"
                value={recAmount}
                onChange={(e) => setRecAmount(e.target.value)}
                placeholder="1500"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold block">মাসের নির্দিষ্ট দিন</label>
              <input
                type="number"
                required
                min="1"
                max="31"
                value={recDay}
                onChange={(e) => setRecDay(e.target.value)}
                placeholder="5"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold block">ধরন</label>
              <select
                value={recType}
                onChange={(e) => setRecType(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="expense" className="bg-slate-900">খরচ</option>
                <option value="income" className="bg-slate-900">আয়</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold block">ক্যাটেগরি</label>
              <select
                value={recCategory}
                onChange={(e) => setRecCategory(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer mt-2 text-sm"
          >
            {loading ? "সংরক্ষণ হচ্ছে..." : "এন্ট্রি যোগ করুন"}
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTransaction ? "লেনদেন সম্পাদনা" : "নতুন লেনদেন যোগ করুন"}
      >
        <TransactionForm
          key={editingTransaction?.id || "new"}
          onSubmit={handleAddTransaction}
          isLoading={loading}
          initialData={editingTransaction}
        />
      </Modal>

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
        onConfirm={executeDelete}
        title="লেনদেন মুছুন"
        message="আপনি কি নিশ্চিত যে আপনি এই লেনদেনটি মুছতে চান? এটি পূর্বাবস্থায় ফেরানো যাবে না।"
        confirmText="মুছুন"
        type="danger"
      />
    </Layout>
  );
};

export default Transactions;
