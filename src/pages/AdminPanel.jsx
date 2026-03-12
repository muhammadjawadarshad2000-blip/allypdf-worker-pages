import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Mail, Clock, Reply, Trash2, Search, BarChart3, 
  MessageSquare, CheckCircle, AlertTriangle, RefreshCw, X, Send, 
  BookOpen, Users, Activity
} from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { contactApi } from '../api/contactApi';

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-900/50 text-yellow-300 border-yellow-700', icon: Clock, label: 'Pending' },
  replied: { color: 'bg-green-900/50 text-green-300 border-green-700', icon: Reply, label: 'Replied' },
  ignored: { color: 'bg-gray-900/50 text-gray-400 border-gray-700', icon: X, label: 'Ignored' },
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('contacts');
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [contactStats, setContactStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ── Data Fetching ────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [adminStatsRes, contactStatsRes] = await Promise.all([
        adminApi.getStats(),
        contactApi.getStats()
      ]);
      setStats(adminStatsRes.data);
      setContactStats(contactStatsRes.data);

      if (activeTab === 'contacts') {
        const res = await contactApi.getAllContacts();
        setContacts(res.data || []);
      } else if (activeTab === 'users') {
        const res = await adminApi.getUsers();
        setUsers(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleUpdateRole = async (userId, role) => {
    try {
      await adminApi.updateUserRole(userId, role);
      setSuccess(`User role updated to ${role}`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update role');
    }
  };

  const handleViewContact = async (id) => {
    try {
      const res = await contactApi.getContact(id);
      setSelectedContact(res.data);
    } catch (err) {
      setError('Failed to load message');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await contactApi.updateStatus(id, status);
      setSuccess(`Status updated to ${status}`);
      if (selectedContact?.id === id) setSelectedContact(prev => ({ ...prev, status }));
      fetchData();
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const handleReply = async () => {
    if (!selectedContact || replyMessage.trim().length < 10) return;
    setIsReplying(true);
    try {
      await contactApi.reply(selectedContact.id, replyMessage);
      setSuccess('Reply sent successfully!');
      setReplyMessage('');
      setSelectedContact(prev => ({ ...prev, status: 'replied' }));
      fetchData();
    } catch (err) {
      setError('Failed to send reply');
    } finally {
      setIsReplying(false);
    }
  };

  const handleDeleteContact = async (id) => {
    if (!window.confirm('Delete this inquiry?')) return;
    try {
      await contactApi.deleteContact(id);
      setSuccess('Contact deleted');
      setSelectedContact(null);
      fetchData();
    } catch (err) {
      setError('Failed to delete');
    }
  };

  // ── Filtered Data ───────────────────────────────────────────────────────

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.email.toLowerCase().includes(search.toLowerCase()) ||
                          c.subject.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#031f33] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Shield className="text-teal-400 w-10 h-10" /> Admin Control
            </h1>
            <p className="text-gray-400 mt-1">Manage system users and support inquiries</p>
          </div>
          <button onClick={() => window.location.href='/admin/blog'} className="flex items-center gap-2 px-6 py-3 bg-sky-800 rounded-xl hover:bg-sky-700 transition font-medium">
            <BookOpen className="w-5 h-5" /> Blog Manager
          </button>
        </div>

        {/* Top Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={stats?.totalUsers} icon={Users} color="text-blue-400" />
          <StatCard title="Active Sessions" value={stats?.activeSessions} icon={Activity} color="text-teal-400" />
          <StatCard title="Pending Inquiries" value={contactStats?.pending} icon={MessageSquare} color="text-yellow-400" />
          <StatCard title="Total Contacts" value={contacts.length || contactStats?.total} icon={Mail} color="text-purple-400" />
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 bg-sky-900/50 p-1.5 rounded-2xl w-fit border border-sky-800">
          <TabButton active={activeTab === 'contacts'} onClick={() => { setActiveTab('contacts'); setSearch(''); }} icon={MessageSquare} label="Inquiries" />
          <TabButton active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setSearch(''); }} icon={Users} label="Users" />
          <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={BarChart3} label="System Stats" />
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'contacts' && (
            <motion.div key="contacts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Inquiry Sidebar */}
              <div className="lg:col-span-1 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search messages..." 
                    className="w-full pl-10 pr-4 py-3 bg-sky-800/50 border border-sky-700 rounded-xl focus:border-teal-400 outline-none text-sm"
                  />
                </div>
                <div className="bg-sky-800/30 border border-sky-700 rounded-2xl overflow-hidden divide-y divide-sky-700 max-h-150 overflow-y-auto">
                  {filteredContacts.map(c => (
                    <button key={c.id} onClick={() => handleViewContact(c.id)} className={`w-full p-4 text-left transition hover:bg-sky-700/40 ${selectedContact?.id === c.id ? 'bg-sky-700/60 border-l-4 border-teal-400' : ''}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm truncate">{c.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_CONFIG[c.status]?.color}`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{c.subject}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Inquiry Detail */}
              <div className="lg:col-span-2">
                {selectedContact ? (
                  <div className="bg-sky-800/40 border border-sky-700 rounded-2xl p-6 space-y-6">
                    <div className="flex justify-between items-start border-b border-sky-700 pb-4">
                      <div>
                        <h2 className="text-2xl font-bold">{selectedContact.name}</h2>
                        <p className="text-teal-400">{selectedContact.email}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(selectedContact.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        {Object.keys(STATUS_CONFIG).map(s => (
                          <button key={s} onClick={() => handleUpdateStatus(selectedContact.id, s)} className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition ${selectedContact.status === s ? 'bg-teal-500' : 'bg-sky-900 border border-sky-700 hover:border-teal-400'}`}>
                            {s}
                          </button>
                        ))}
                        <button onClick={() => handleDeleteContact(selectedContact.id)} className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg"><Trash2 size={18} /></button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Subject: {selectedContact.subject}</p>
                      <div className="bg-sky-900/50 p-5 rounded-2xl border border-sky-700 text-gray-200 leading-relaxed">
                        {selectedContact.message}
                      </div>
                    </div>
                    <div className="pt-6 border-t border-sky-700">
                      <textarea 
                        value={replyMessage} onChange={e => setReplyMessage(e.target.value)}
                        placeholder="Write your official response here..."
                        className="w-full bg-sky-900 border border-sky-700 rounded-2xl p-5 text-sm outline-none focus:border-teal-400 h-40 resize-none transition-all"
                      />
                      <button 
                        onClick={handleReply} disabled={isReplying || replyMessage.length < 10}
                        className="mt-4 w-full py-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
                      >
                        {isReplying ? <RefreshCw className="animate-spin" /> : <Send size={20} />} Send Response
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-100 flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-sky-800 rounded-3xl">
                    <MessageSquare size={64} className="mb-4 opacity-20" />
                    <p className="text-lg">Select a conversation to manage</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-sky-800/30 border border-sky-700 rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-sky-700 flex justify-between items-center">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter users by name or email..." className="w-full pl-10 pr-4 py-2.5 bg-sky-900/50 border border-sky-700 rounded-xl outline-none" />
                </div>
              </div>
              <table className="w-full text-left">
                <thead className="bg-sky-900/50 text-xs text-gray-500 uppercase font-bold">
                  <tr>
                    <th className="px-6 py-4">Full Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Current Role</th>
                    <th className="px-6 py-4">Join Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-700">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-sky-700/20 transition">
                      <td className="px-6 py-4 font-medium">{u.fullName}</td>
                      <td className="px-6 py-4 text-gray-400">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${u.role === 'admin' ? 'bg-purple-900/50 text-purple-300 border-purple-700' : 'bg-blue-900/50 text-blue-300 border-blue-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <select 
                          value={u.role} onChange={e => handleUpdateRole(u.id, e.target.value)}
                          className="bg-sky-900 border border-sky-700 rounded-lg px-2 py-1 text-xs outline-none"
                        >
                          <option value="user">Set User</option>
                          <option value="admin">Set Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-sky-800/40 border border-sky-700 rounded-3xl p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Activity className="text-teal-400" /> System Capacity</h3>
                  <div className="space-y-6">
                    <StatRow label="Registered Users" value={stats?.totalUsers} />
                    <StatRow label="Active Edge Sessions" value={stats?.activeSessions} />
                    <StatRow label="Pending Inquiries" value={contactStats?.pending} />
                  </div>
               </div>
               <div className="bg-sky-800/40 border border-sky-700 rounded-3xl p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><MessageSquare className="text-blue-400" /> Support Metrics</h3>
                  <div className="space-y-6">
                    <StatRow label="Total Conversations" value={contacts.length || contactStats?.total} />
                    <StatRow label="Replied Tickets" value={contactStats?.replied} />
                    <StatRow label="Ignored/Spam" value={contactStats?.ignored} />
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Notifications */}
        <div className="fixed bottom-8 right-8 space-y-4">
          <AnimatePresence>
            {success && (
              <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className="bg-teal-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
                <CheckCircle size={20} /> {success}
              </motion.div>
            )}
            {error && (
              <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className="bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
                <AlertTriangle size={20} /> {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// ── Shared UI Components ───────────────────────────────────────────────────

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-sky-800/40 border border-sky-700 p-6 rounded-3xl flex items-center gap-4 transition hover:bg-sky-800/60">
    <div className={`p-4 bg-sky-900/80 rounded-2xl ${color}`}><Icon size={28} /></div>
    <div>
      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{title}</p>
      <p className="text-3xl font-black">{value ?? '...'}</p>
    </div>
  </div>
);

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition ${active ? 'bg-teal-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
    <Icon size={18} /> {label}
  </button>
);

const StatRow = ({ label, value }) => (
  <div className="flex justify-between items-center border-b border-sky-700/50 pb-4">
    <span className="text-gray-400 font-medium">{label}</span>
    <span className="text-2xl font-black text-teal-400">{value ?? 0}</span>
  </div>
);

export default AdminPanel;