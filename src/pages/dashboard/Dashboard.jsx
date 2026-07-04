import React, { useState, useEffect, useMemo } from "react";
import Layout from "../../components/layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { 
  subscribeToTransactions,
  addTransaction,
  subscribeToRecurringConfigs,
  updateRecurringLastProcessed,
  subscribeToGoals,
  addGoal,
  updateGoal,
  deleteGoal,
  subscribeToBudgets
} from "../../services/transactionService";
import { motion } from "framer-motion";
import { 
  FaWallet, 
  FaArrowUp, 
  FaArrowDown, 
  FaChartLine,
  FaPlus,
  FaTrash,
  FaEdit,
  FaBullseye,
  FaTimes
} from "react-icons/fa";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Modal from "../../components/layout/Modal";

const StatCard = ({ title, amount, icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass-card p-6 rounded-3xl"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <h2 className="text-3xl font-bold mt-1">
          ৳{parseFloat(amount).toLocaleString()}
        </h2>
      </div>
      <div className={`p-4 rounded-2xl ${color} bg-opacity-20`}>{icon}</div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { user, userData } = useAuth();
  const [transactions, setTransactions] = useState([]);

  const budgets = useMemo(() => userData?.budgets || [], [userData?.budgets]);
  const goals = useMemo(() => userData?.goals || [], [userData?.goals]);
  const recurringConfigs = useMemo(() => userData?.recurringConfigs || [], [userData?.recurringConfigs]);

  // Savings Goal Modal State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalSaved, setGoalSaved] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Subscriptions Effect
  useEffect(() => {
    if (!user) return;
    const unsubTx = subscribeToTransactions(user.uid, (data) => {
      setTransactions(data);
    });
    return () => unsubTx();
  }, [user]);

  // Background processor for recurring transactions
  useEffect(() => {
    if (!user || recurringConfigs.length === 0) return;

    const processRecurring = async () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-11
      const currentDay = now.getDate();
      
      const currentMonthStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}`;
      let updatedConfigs = [...recurringConfigs];
      let hasChanges = false;

      for (let i = 0; i < updatedConfigs.length; i++) {
        const config = updatedConfigs[i];
        if (config.lastProcessedMonth !== currentMonthStr && currentDay >= config.dayOfMonth) {
          try {
            await addTransaction(user.uid, {
              type: config.type,
              amount: config.amount,
              category: config.category,
              note: `${config.title} (পুনরাবৃত্তিমূলক)`,
              date: now.toISOString().split("T")[0],
            });

            updatedConfigs[i] = { ...config, lastProcessedMonth: currentMonthStr };
            hasChanges = true;
          } catch (error) {
            console.error("Failed to process recurring transaction:", error);
          }
        }
      }

      if (hasChanges) {
        try {
          const { updateUserRecurringConfigs } = await import("../../services/userService");
          await updateUserRecurringConfigs(user.uid, updatedConfigs);
        } catch (error) {
          console.error("Failed to save updated recurring config states:", error);
        }
      }
    };

    processRecurring();
  }, [user, recurringConfigs]);

  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((t) => {
      const amt = parseFloat(t.amount) || 0;
      if (t.type === "income") totalIncome += amt;
      else totalExpense += amt;
    });

    return {
      balance: totalIncome - totalExpense,
      income: totalIncome,
      expenses: totalExpense,
      savingsRate:
        totalIncome > 0
          ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100)
          : 0,
    };
  }, [transactions]);

  // Budget Alerts Calculation
  const budgetAlerts = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const monthlyCategoryExpenses = {};
    transactions.forEach((t) => {
      if (t.type === "expense" && t.date) {
        const tDate = new Date(t.date);
        if (tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth) {
          const amt = parseFloat(t.amount) || 0;
          monthlyCategoryExpenses[t.category] = (monthlyCategoryExpenses[t.category] || 0) + amt;
        }
      }
    });

    const alerts = [];
    budgets.forEach((b) => {
      const spent = monthlyCategoryExpenses[b.category] || 0;
      if (spent > b.limitAmount) {
        alerts.push({
          category: b.category,
          limit: b.limitAmount,
          spent,
          percent: Math.round((spent / b.limitAmount) * 100),
          type: "exceeded"
        });
      } else if (spent >= b.limitAmount * 0.8) {
        alerts.push({
          category: b.category,
          limit: b.limitAmount,
          spent,
          percent: Math.round((spent / b.limitAmount) * 100),
          type: "warning"
        });
      }
    });
    return alerts;
  }, [transactions, budgets]);

  // Goal Modal Handlers
  const handleOpenGoalModal = (goal = null) => {
    if (goal) {
      setEditingGoal(goal);
      setGoalTitle(goal.title);
      setGoalTarget(goal.targetAmount);
      setGoalSaved(goal.savedAmount);
      setGoalDate(goal.targetDate || "");
    } else {
      setEditingGoal(null);
      setGoalTitle("");
      setGoalTarget("");
      setGoalSaved("0");
      setGoalDate("");
    }
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    if (!goalTitle || !goalTarget) return;

    setIsActionLoading(true);
    try {
      const existingGoals = userData?.goals || [];
      let newGoals = [];

      const goalData = {
        title: goalTitle,
        targetAmount: parseFloat(goalTarget),
        savedAmount: parseFloat(goalSaved) || 0,
        targetDate: goalDate,
      };

      if (editingGoal) {
        newGoals = existingGoals.map((g) => 
          g.id === editingGoal.id ? { ...g, ...goalData } : g
        );
      } else {
        newGoals = [
          ...existingGoals,
          {
            id: Date.now().toString(),
            ...goalData,
            createdAt: new Date().toISOString()
          }
        ];
      }

      const { updateUserGoals } = await import("../../services/userService");
      await updateUserGoals(user.uid, newGoals);
      setIsGoalModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("সঞ্চয় লক্ষ্য সংরক্ষণ করতে ব্যর্থ হয়েছে।");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!confirm("আপনি কি নিশ্চিত যে আপনি এই লক্ষ্যটি মুছে ফেলতে চান?")) return;
    try {
      const existingGoals = userData?.goals || [];
      const newGoals = existingGoals.filter((g) => g.id !== goalId);
      
      const { updateUserGoals } = await import("../../services/userService");
      await updateUserGoals(user.uid, newGoals);
    } catch (err) {
      console.error(err);
      alert("মুছে ফেলতে ব্যর্থ হয়েছে।");
    }
  };

  // Format data for chart (last 10 transactions)
  const chartData = useMemo(() => {
    return transactions
      .slice(0, 10)
      .reverse()
      .map((t) => ({
        name: t.date
          ? new Date(t.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : "অনুপলব্ধ",
        amount: parseFloat(t.amount),
      }));
  }, [transactions]);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">আর্থিক সারসংক্ষেপ</h1>
        <p className="text-slate-400">
          স্বাগতম! আপনার অর্থের সাম্প্রতিক অবস্থা নিচে দেখানো হলো।
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="মোট ব্যালান্স"
          amount={stats.balance}
          icon={<FaWallet className="text-indigo-400" />}
          color="bg-indigo-400"
          delay={0.1}
        />
        <StatCard
          title="মাসিক আয়"
          amount={stats.income}
          icon={<FaArrowUp className="text-emerald-400" />}
          color="bg-emerald-400"
          delay={0.2}
        />
        <StatCard
          title="মাসিক খরচ"
          amount={stats.expenses}
          icon={<FaArrowDown className="text-rose-400" />}
          color="bg-rose-400"
          delay={0.3}
        />
        <StatCard
          title="সঞ্চয় হার"
          amount={`${stats.savingsRate}%`}
          icon={<FaChartLine className="text-amber-400" />}
          color="bg-amber-400"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 glass p-8 rounded-3xl"
        >
          <h3 className="text-xl font-bold mb-8">খরচের প্রবণতা</h3>
          <div className="h-64 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `৳${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#818cf8" }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#6366F1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorAmt)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col gap-6"
        >
          {/* AI Analysis Card */}
          <div className="glass p-8 rounded-3xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaChartLine className="text-indigo-400" />
              স্মার্ট এআই বিশ্লেষণ
            </h3>
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-2xl">
              <p className="text-slate-300 leading-relaxed text-sm">
                {stats.expenses > stats.income
                  ? "আপনার খরচ বর্তমানে আপনার আয়ের চেয়ে বেশি। সম্ভাব্য সঞ্চয়ের জন্য 'শপিং' এবং 'বিনোদন' বিভাগগুলো পর্যালোচনা করুন।"
                  : stats.income > 0
                    ? `চমৎকার! এই সময়ে আপনি আপনার আয়ের ${stats.savingsRate}% সঞ্চয় করেছেন। আপনার বর্তমান সঞ্চয় হার বজায় রাখলে আপনি দ্রুত আপনার সঞ্চয় লক্ষ্যমাত্রা পূরণ করতে পারবেন।`
                    : "আপনার আয় ও খরচ যোগ করুন — এখানে এআই-চালিত আর্থিক বিশ্লেষণ দেখানো হবে।"}
              </p>
              
              {/* Budget Alerts inside AI Panel */}
              {budgetAlerts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-indigo-500/20 space-y-2">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-widest block mb-2">
                    বাজেট অ্যালার্ট
                  </span>
                  {budgetAlerts.map((alert, idx) => (
                    <div key={idx} className={`text-xs p-2.5 rounded-xl border ${
                      alert.type === "exceeded" 
                        ? "bg-rose-500/10 text-rose-300 border-rose-500/20" 
                        : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                    }`}>
                      {alert.type === "exceeded" ? "🚨 " : "⚠️ "} 
                      <strong>{alert.category}</strong> বাজেটের {alert.percent}% খরচ হয়েছে (৳{alert.spent.toLocaleString()} / ৳{alert.limit.toLocaleString()})
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Savings Goals Card */}
          <div className="glass p-8 rounded-3xl flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FaBullseye className="text-indigo-400" />
                সঞ্চয় লক্ষ্যমাত্রা
              </h3>
              <button
                onClick={() => handleOpenGoalModal()}
                className="px-3 py-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all text-xs font-semibold cursor-pointer"
              >
                + লক্ষ্য যোগ
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto max-h-80 custom-scrollbar pr-1">
              {goals.length === 0 ? (
                <div className="text-center text-slate-500 py-12 text-sm flex-1 flex flex-col justify-center items-center">
                  <FaBullseye size={32} className="text-slate-700 mb-2" />
                  <span>কোন সঞ্চয় লক্ষ্য সেট করা নেই।</span>
                </div>
              ) : (
                goals.map((g) => {
                  const percent = Math.min(Math.round((g.savedAmount / g.targetAmount) * 100), 100);
                  const remaining = Math.max(g.targetAmount - g.savedAmount, 0);
                  
                  return (
                    <div key={g.id} className="p-4 bg-slate-900/30 border border-slate-800 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-slate-200 text-sm">{g.title}</h4>
                          {g.targetDate && (
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              টার্গেট তারিখ: {g.targetDate}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenGoalModal(g)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800/80 transition-all cursor-pointer"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteGoal(g.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/80 transition-all cursor-pointer"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-400">
                            ৳{g.savedAmount.toLocaleString()} / ৳{g.targetAmount.toLocaleString()}
                          </span>
                          <span className="text-indigo-400">{percent}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">
                          {remaining > 0 ? `বাকি আছে: ৳${remaining.toLocaleString()}` : "লক্ষ্য অর্জিত হয়েছে! 🎉"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Add/Edit Goal Modal */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title={editingGoal ? "সঞ্চয় লক্ষ্য সংশোধন" : "নতুন সঞ্চয় লক্ষ্য যোগ করুন"}
      >
        <form onSubmit={handleSaveGoal} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-semibold block">লক্ষ্যের নাম</label>
            <input
              type="text"
              required
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="যেমন: নতুন ফোন কেনা, বাইক কেনা"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold block">লক্ষ্য পরিমাণ (৳)</label>
              <input
                type="number"
                required
                min="1"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                placeholder="50000"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold block">ইতিমধ্যে জমানো (৳)</label>
              <input
                type="number"
                min="0"
                value={goalSaved}
                onChange={(e) => setGoalSaved(e.target.value)}
                placeholder="10000"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-semibold block">টার্গেট তারিখ (ঐচ্ছিক)</label>
            <input
              type="date"
              value={goalDate}
              onChange={(e) => setGoalDate(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isActionLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer mt-2 text-sm"
          >
            {isActionLoading ? "সংরক্ষণ হচ্ছে..." : "লক্ষ্য সংরক্ষণ করুন"}
          </button>
        </form>
      </Modal>
    </Layout>
  );
};

export default Dashboard;
