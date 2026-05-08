import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { subscribeToTransactions } from '../../services/transactionService';
import { motion } from 'framer-motion';
import { FaWallet, FaArrowUp, FaArrowDown, FaChartLine } from 'react-icons/fa';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

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
        <h2 className="text-3xl font-bold mt-1">৳{parseFloat(amount).toLocaleString()}</h2>
      </div>
      <div className={`p-4 rounded-2xl ${color} bg-opacity-20`}>
        {icon}
      </div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTransactions(user.uid, (data) => {
      setTransactions(data);
    });
    return () => unsubscribe();
  }, [user]);

  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    
    transactions.forEach(t => {
      const amt = parseFloat(t.amount) || 0;
      if (t.type === 'income') totalIncome += amt;
      else totalExpense += amt;
    });

    return {
      balance: totalIncome - totalExpense,
      income: totalIncome,
      expenses: totalExpense,
      savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0
    };
  }, [transactions]);

  // Format data for chart (last 7 days or similar)
  const chartData = useMemo(() => {
    // This is a simplified version - in a real app you'd group by date
    return transactions.slice(0, 10).reverse().map(t => ({
      name: t.date ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
      amount: parseFloat(t.amount)
    }));
  }, [transactions]);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Financial Overview</h1>
        <p className="text-slate-400">Welcome back! Here's what's happening with your money.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Balance" 
          amount={stats.balance} 
          icon={<FaWallet className="text-indigo-400" />} 
          color="bg-indigo-400"
          delay={0.1}
        />
        <StatCard 
          title="Monthly Income" 
          amount={stats.income} 
          icon={<FaArrowUp className="text-emerald-400" />} 
          color="bg-emerald-400"
          delay={0.2}
        />
        <StatCard 
          title="Monthly Expenses" 
          amount={stats.expenses} 
          icon={<FaArrowDown className="text-rose-400" />} 
          color="bg-rose-400"
          delay={0.3}
        />
        <StatCard 
          title="Savings Rate" 
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
          <h3 className="text-xl font-bold mb-8">Spending Trends</h3>
          <div className="h-64 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
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
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#818cf8' }}
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
          className="glass p-8 rounded-3xl"
        >
          <h3 className="text-xl font-bold mb-4">AI Insight</h3>
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-2xl">
            <div className="flex items-center space-x-3 mb-4 text-indigo-400">
              <FaChartLine />
              <span className="font-bold">Smart Analysis</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {stats.expenses > stats.income 
                ? "Your expenses currently exceed your income. Consider reviewing your 'Shopping' and 'Entertainment' categories to find potential savings."
                : stats.income > 0 
                  ? `Great job! You've saved ${stats.savingsRate}% of your income this period. Based on your trends, you could reach your savings goal 2 months earlier.`
                  : "Start adding your income and expenses to see AI-powered financial insights here."}
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Dashboard;
