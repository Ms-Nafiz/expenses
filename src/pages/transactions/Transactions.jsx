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
} from "react-icons/fa";
import { format } from "date-fns";
import { exportToExcel, exportToPDF } from "../../utils/exportUtils";

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    id: null,
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTransactions(user.uid, (data) => {
      setTransactions(data);
    });
    return () => unsubscribe();
  }, [user]);

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

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || t.type === filterType;
    return matchesSearch && matchesType;
  });

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

  const SummaryCard = ({ title, amount, type }) => (
    <div className="glass p-4 rounded-2xl border border-slate-800 flex-1">
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
        {title}
      </p>
      <p
        className={`text-xl font-bold mt-1 ${
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
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">লেনদেন</h1>
          <p className="text-slate-400">
            আপনার আর্থিক নথি দেখুন এবং পরিচালনা করুন।
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportToExcel(transactions)}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl transition-all border border-slate-700"
          >
            <FaFileExcel className="text-emerald-500" />
            <span className="hidden md:inline">এক্সেল</span>
          </button>
          <button
            onClick={() => exportToPDF(transactions)}
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <SummaryCard title="মোট আয়" amount={totals.income} type="income" />
        <SummaryCard title="মোট খরচ" amount={totals.expense} type="expense" />
        <SummaryCard
          title="নেট ব্যালান্স"
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

        {/* Mobile View: Card List */}
        <div className="lg:hidden divide-y divide-slate-800">
          {filteredTransactions.map((t) => (
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

        {/* Desktop View: Table */}
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
                {filteredTransactions.map((t) => (
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
      </div>

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
