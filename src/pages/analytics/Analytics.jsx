import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { subscribeToTransactions } from '../../services/transactionService';
import { motion } from 'framer-motion';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#64748B'];

const Analytics = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [analysisType, setAnalysisType] = useState('all');

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTransactions(user.uid, (data) => {
      setTransactions(data);
    });
    return () => unsubscribe();
  }, [user]);

  const categoryData = useMemo(() => {
    const categories = {};
    transactions
      .filter(t => analysisType === 'all' || t.type === analysisType)
      .forEach(t => {
        const catName = t.category || 'Uncategorized';
        categories[catName] = (categories[catName] || 0) + parseFloat(t.amount || 0);
      });
    return Object.keys(categories)
      .map(key => ({
        name: key,
        value: categories[key]
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, analysisType]);

  const monthlyComparison = useMemo(() => {
    // Simplified: grouping all data into Income vs Expense
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
      if (t.type === 'income') income += parseFloat(t.amount);
      else expense += parseFloat(t.amount);
    });
    return [
      { name: 'Income', amount: income },
      { name: 'Expense', amount: expense }
    ];
  }, [transactions]);

  return (
    <Layout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Financial Analytics</h1>
          <p className="text-slate-400">Detailed breakdown of your {analysisType === 'expense' ? 'spending' : 'earnings'}.</p>
        </div>
        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setAnalysisType('all')}
            className={`px-6 py-2 rounded-lg transition-all font-medium ${analysisType === 'all' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            All
          </button>
          <button
            onClick={() => setAnalysisType('expense')}
            className={`px-6 py-2 rounded-lg transition-all font-medium ${analysisType === 'expense' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Expenses
          </button>
          <button
            onClick={() => setAnalysisType('income')}
            className={`px-6 py-2 rounded-lg transition-all font-medium ${analysisType === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Income
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-8 rounded-3xl h-[450px]"
        >
          <h3 className="text-xl font-bold mb-8">
            {analysisType === 'all' ? 'All Transactions' : (analysisType === 'expense' ? 'Expenses' : 'Income')} by Category
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-slate-400 text-xs">{value}</span>}/>
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass p-8 rounded-3xl h-[450px]"
        >
          <h3 className="text-xl font-bold mb-8">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
              />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                {monthlyComparison.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#EF4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="mt-8 glass p-8 rounded-3xl">
        <h3 className="text-xl font-bold mb-6">Spending Breakdown</h3>
        <div className="space-y-4">
          {categoryData.sort((a, b) => b.value - a.value).map((cat, index) => (
            <div key={cat.name} className="flex items-center gap-4">
              <div className="w-24 text-sm text-slate-400 truncate">{cat.name}</div>
              <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(cat.value / categoryData.reduce((acc, curr) => acc + curr.value, 0)) * 100}%` }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
              </div>
              <div className="w-24 text-right font-bold text-slate-200">
                ৳{cat.value.toLocaleString()}
              </div>
            </div>
          ))}
          {categoryData.length === 0 && (
            <p className="text-center text-slate-500 py-4">No data available for the selected period.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
