import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { API_URL } from '../config';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/admin/login`, { email, password });
      if (response.data.success) {
        localStorage.setItem('admin_authenticated', 'true');
        setLoading(false);
        navigate('/admin');
        window.location.reload();
      }
    } catch (err) {
      // Offline fallback if server is unreachable or disabled
      if (!err.response && email === 'admin@hiresight.com' && password === 'password123') {
        localStorage.setItem('admin_authenticated', 'true');
        setLoading(false);
        navigate('/admin');
        window.location.reload();
        return;
      }
      setLoading(false);
      setError(err.response?.data?.error || 'Invalid administrator email or password.');
    }
  };

  return (
    <div className="pt-24 pb-20 min-h-screen bg-slate-50 flex items-center justify-center px-6 relative overflow-hidden text-slate-800">
      {/* Background Gradients */}
      <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="surface-card bg-white border border-slate-200 rounded-2xl shadow-xl p-8 max-w-md w-full relative z-10"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
            <Lock size={22} />
          </div>
          <h2 className="text-2xl font-bold font-outfit text-slate-900 tracking-tight">HR Portal Access</h2>
          <p className="text-slate-500 text-xs mt-1.5 leading-relaxed max-w-[280px]">
            Please enter your administrative credentials to manage your candidates and routing rules.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 block">Work Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10 py-2 text-sm bg-white" 
                placeholder="name@hiresight.com"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 block">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10 py-2 text-sm bg-white" 
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold p-3 rounded-lg flex items-start gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary w-full py-3 text-xs font-bold shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5"
          >
            {loading ? 'Validating Session...' : 'Sign In to Portal'}
            {!loading && <ArrowRight size={14} />}
          </button>
        </form>

      </motion.div>
    </div>
  );
};

export default AdminLogin;
