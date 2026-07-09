import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  Users, UserCheck, CalendarCheck, UserMinus, Plus, Trash2, 
  Settings, ArrowRight, ShieldCheck, Mail, Phone, Briefcase
} from 'lucide-react';
import { API_URL } from '../config';

const AdminDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Rule form state
  const [newRule, setNewRule] = useState({
    position_pattern: '',
    assigned_tl: '',
    assigned_manager: ''
  });
  const [ruleSubmitting, setRuleSubmitting] = useState(false);
  const [ruleError, setRuleError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [candRes, rulesRes] = await Promise.all([
        axios.get(`${API_URL}/candidates`),
        axios.get(`${API_URL}/rules`)
      ]);
      setCandidates(candRes.data || []);
      setRules(rulesRes.data || []);
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!newRule.position_pattern || !newRule.assigned_tl || !newRule.assigned_manager) {
      setRuleError('All rule fields are required.');
      return;
    }
    
    setRuleSubmitting(true);
    setRuleError('');

    try {
      const response = await axios.post(`${API_URL}/rules`, newRule);
      setRules([...rules.filter(r => r.position_pattern.toLowerCase() !== newRule.position_pattern.toLowerCase()), response.data]);
      setNewRule({ position_pattern: '', assigned_tl: '', assigned_manager: '' });
    } catch (err) {
      console.error(err);
      setRuleError('Failed to save assignment rule.');
    } finally {
      setRuleSubmitting(false);
    }
  };

  const handleDeleteRule = async (id) => {
    try {
      await axios.delete(`${API_URL}/rules/${id}`);
      setRules(rules.filter(r => r.id !== id));
    } catch (e) {
      console.error('Failed to delete rule:', e);
    }
  };

  // Pipeline stats calculation
  const totalCount = candidates.length;
  const interviewingCount = candidates.filter(c => c.status === 'Interview Scheduled' || c.status === 'Under Review').length;
  const hiredCount = candidates.filter(c => c.status === 'Hired' || c.status === 'Selected').length;
  const rejectedCount = candidates.filter(c => c.status === 'Rejected').length;

  return (
    <div className="pt-24 pb-20 px-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto w-full">
        
        {/* Page Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck size={14} />
              <span>HR Admin workspace</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight font-outfit">Recruitment Analytics</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Link to="/admin/upload" className="btn btn-secondary shadow-sm hover:no-underline">
              Bulk Import Candidates
            </Link>
            <Link to="/admin/candidates" className="btn btn-primary shadow-lg shadow-indigo-600/10 hover:no-underline">
              Manage Candidates Pool
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard 
            icon={<Users className="text-indigo-600" />}
            title="Total Candidates"
            value={loading ? '...' : totalCount}
            color="border-indigo-200"
            sub="Active applications"
          />
          <StatCard 
            icon={<CalendarCheck className="text-amber-600" />}
            title="In Review & Interviewing"
            value={loading ? '...' : interviewingCount}
            color="border-amber-200"
            sub="Under active review"
          />
          <StatCard 
            icon={<UserCheck className="text-emerald-600" />}
            title="Offers & Hired"
            value={loading ? '...' : hiredCount}
            color="border-emerald-200"
            sub="Successful selections"
          />
          <StatCard 
            icon={<UserMinus className="text-rose-600" />}
            title="Rejected"
            value={loading ? '...' : rejectedCount}
            color="border-rose-200"
            sub="Archived profiles"
          />
        </div>

        {/* Main Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Candidates */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="surface-card bg-white p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 font-outfit">Recent Applicants</h3>
                <Link to="/admin/candidates" className="text-indigo-600 text-xs font-bold hover:underline flex items-center gap-1">
                  View All Candidates <ArrowRight size={14} />
                </Link>
              </div>

              {loading ? (
                <div className="py-20 text-center text-slate-400 font-semibold animate-pulse">Loading candidate list...</div>
              ) : candidates.length === 0 ? (
                <div className="py-20 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="font-bold text-slate-600 mb-1">No candidates in pipeline</p>
                  <p className="text-xs text-slate-400">Import a CSV file to load candidate data.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto pr-2">
                  {candidates.slice(0, 5).map((candidate) => (
                    <div key={candidate.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm shrink-0">
                          {candidate.first_name[0]}{candidate.last_name ? candidate.last_name[0] : ''}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-tight">
                            {candidate.first_name} {candidate.last_name}
                          </h4>
                          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                            <Briefcase size={12} className="text-slate-400" />
                            {candidate.position}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                          candidate.status === 'Hired' ? 'bg-emerald-100 text-emerald-800' :
                          candidate.status === 'Selected' ? 'bg-teal-100 text-teal-800' :
                          candidate.status === 'Interview Scheduled' ? 'bg-amber-100 text-amber-800' :
                          candidate.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                          'bg-indigo-100 text-indigo-800'
                        }`}>
                          {candidate.status}
                        </span>
                        
                        <div className="text-right text-[10px] text-slate-400">
                          <p className="font-bold text-slate-600 leading-none">Assignees:</p>
                          <p className="mt-0.5 text-slate-500">{candidate.assigned_tl} (TL)</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Tips */}
            <div className="surface-card bg-indigo-900 text-white p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="text-white font-bold mb-1 font-outfit text-base">Automatic Assignment Rules</h4>
                <p className="text-indigo-200 text-xs max-w-md">
                  Candidates imported via CSV or manually are automatically routed to specific Team Leads (TL) and Managers according to their applied job title. Setup rules on the right to manage routing.
                </p>
              </div>
              <Link to="/admin/upload" className="btn bg-white text-indigo-900 hover:bg-slate-100 text-xs font-bold shrink-0 hover:no-underline">
                Upload LinkedIn CSV
              </Link>
            </div>
          </div>

          {/* Assignment Rules Management */}
          <div className="flex flex-col gap-6">
            
            {/* Rules Form */}
            <div className="surface-card bg-white p-6">
              <h3 className="text-base font-bold text-slate-800 font-outfit mb-4 flex items-center gap-2">
                <Settings size={18} className="text-slate-500" />
                Configure Assignment Rule
              </h3>
              
              <form onSubmit={handleAddRule} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Job Title Match Pattern</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineer, Frontend"
                    value={newRule.position_pattern}
                    onChange={(e) => setNewRule({...newRule, position_pattern: e.target.value})}
                    className="input-field py-2 text-sm"
                  />
                  <p className="text-[10px] text-slate-400">Assigns candidates whose job contains this phrase.</p>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Assign to Team Lead (TL)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alice Watson (TL)"
                    value={newRule.assigned_tl}
                    onChange={(e) => setNewRule({...newRule, assigned_tl: e.target.value})}
                    className="input-field py-2 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Assign to Manager (MGR)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Robert Smith (MGR)"
                    value={newRule.assigned_manager}
                    onChange={(e) => setNewRule({...newRule, assigned_manager: e.target.value})}
                    className="input-field py-2 text-sm"
                  />
                </div>

                {ruleError && <div className="text-xs font-semibold text-rose-500">{ruleError}</div>}

                <button 
                  type="submit" 
                  disabled={ruleSubmitting}
                  className="btn btn-primary w-full py-2.5 text-sm"
                >
                  <Plus size={16} />
                  <span>Create Assignment Rule</span>
                </button>
              </form>
            </div>

            {/* Active Rules List */}
            <div className="surface-card bg-white p-6 flex-1 flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 font-outfit mb-3">Active Routing Rules ({rules.length})</h3>
              
              {loading ? (
                <div className="py-10 text-center text-slate-400 text-xs">Loading rules...</div>
              ) : rules.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs bg-slate-50 rounded-lg">No active assignment rules.</div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
                  {rules.map((rule) => (
                    <div key={rule.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between gap-3 hover:bg-slate-100/50 transition-colors">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate">{rule.position_pattern}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">TL: {rule.assigned_tl}</p>
                        <p className="text-[10px] text-slate-500 truncate">Mgr: {rule.assigned_manager}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                        title="Delete Rule"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, color, sub }) => (
  <div className={`surface-card bg-white p-6 border-l-4 ${color}`}>
    <div className="flex justify-between items-start mb-4">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</span>
      <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
    </div>
    <div className="text-3xl font-black font-outfit text-slate-900 mb-1">{value}</div>
    <span className="text-[10px] text-slate-500">{sub}</span>
  </div>
);

export default AdminDashboard;
