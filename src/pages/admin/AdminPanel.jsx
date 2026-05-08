import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { subscribeToAllUsers, updateUserStatus } from '../../services/userService';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserShield, FaCheckCircle, FaClock, FaEnvelope, FaUserEdit } from 'react-icons/fa';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAllUsers((data) => {
      setUsers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'pending' : 'active';
    try {
      await updateUserStatus(userId, newStatus);
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Error updating user status");
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <FaUserShield className="text-indigo-400" />
          Admin Control Panel
        </h1>
        <p className="text-slate-400">Manage user access and approvals.</p>
      </div>

      <div className="glass rounded-3xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">User Email</th>
                <th className="px-6 py-4 font-medium">Joined Date</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <AnimatePresence>
                {users.map((u) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-800/30 transition-all"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                          <FaEnvelope size={12} />
                        </div>
                        <span className="text-slate-200 text-sm">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {u.status === 'active' ? (
                          <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                            <FaCheckCircle /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                            <FaClock /> Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleStatus(u.id, u.status)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            u.status === 'active' 
                              ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Approve'}
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {users.length === 0 && !loading && (
          <div className="p-12 text-center text-slate-500">
            No users found in the system.
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminPanel;
