import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  Users, Search, Filter, Trash2, Edit, Plus, X, Calendar, 
  CheckCircle2, Mail, Phone, Briefcase, Award, FileText, ChevronDown
} from 'lucide-react';
import { API_URL } from '../config';

const AdminCandidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [positionFilter, setPositionFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Modal controls
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Forms state
  const [candForm, setCandForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: 'Software Engineer',
    experience: '',
    skills: '',
    linkedin_profile: '',
    status: 'Applied',
    assigned_tl: '',
    assigned_manager: '',
    interview_date: '',
    interview_feedback: '',
    source: 'Manual'
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/candidates`);
      setCandidates(res.data || []);
    } catch (e) {
      console.error('Error fetching candidates:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleOpenAdd = () => {
    setCandForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: 'Software Engineer',
      experience: '2 years',
      skills: '',
      linkedin_profile: '',
      status: 'Applied',
      assigned_tl: '',
      assigned_manager: '',
      interview_date: '',
      interview_feedback: '',
      source: 'Manual'
    });
    setFormError('');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (cand) => {
    setSelectedCandidate(cand);
    
    // Format date for datetime-local input
    let formattedDate = '';
    if (cand.interview_date) {
      const d = new Date(cand.interview_date);
      formattedDate = d.toISOString().slice(0, 16);
    }

    setCandForm({
      first_name: cand.first_name || '',
      last_name: cand.last_name || '',
      email: cand.email || '',
      phone: cand.phone || '',
      position: cand.position || '',
      experience: cand.experience || '',
      skills: cand.skills || '',
      linkedin_profile: cand.linkedin_profile || '',
      status: cand.status || 'Applied',
      assigned_tl: cand.assigned_tl || '',
      assigned_manager: cand.assigned_manager || '',
      interview_date: formattedDate,
      interview_feedback: cand.interview_feedback || '',
      source: cand.source || 'Manual'
    });
    setFormError('');
    setIsEditOpen(true);
  };

  const handleFormChange = (e) => {
    setCandForm({ ...candForm, [e.target.name]: e.target.value });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!candForm.first_name || !candForm.email || !candForm.position) {
      setFormError('Name, Email and Position are required fields.');
      return;
    }
    setFormSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/candidates`, candForm);
      setCandidates([response.data, ...candidates]);
      setIsAddOpen(false);
    } catch (err) {
      setFormError('Failed to create candidate.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const payload = { ...candForm };
      // If empty date, remove it or set null
      if (!payload.interview_date) {
        payload.interview_date = null;
      }
      const response = await axios.patch(`${API_URL}/candidates/${selectedCandidate.id}`, payload);
      setCandidates(candidates.map(c => c.id === selectedCandidate.id ? response.data : c));
      setIsEditOpen(false);
    } catch (err) {
      setFormError('Failed to update candidate.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) return;
    try {
      await axios.delete(`${API_URL}/candidates/${id}`);
      setCandidates(candidates.filter(c => c.id !== id));
    } catch (e) {
      console.error('Failed to delete candidate:', e);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('WARNING: Are you sure you want to delete ALL candidates from the system?')) return;
    try {
      await axios.delete(`${API_URL}/candidates`);
      setCandidates([]);
    } catch (e) {
      console.error('Failed to clear candidates:', e);
    }
  };

  // Unique list of positions for filtering
  const positionsList = ['All', ...new Set(candidates.map(c => c.position).filter(Boolean))];

  // Filtering logic
  const filteredCandidates = candidates.filter(cand => {
    const fullName = `${cand.first_name} ${cand.last_name || ''}`.toLowerCase();
    const searchMatch = fullName.includes(searchTerm.toLowerCase()) || 
                        (cand.email && cand.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (cand.skills && cand.skills.toLowerCase().includes(searchTerm.toLowerCase()));
    const statusMatch = statusFilter === 'All' || cand.status === statusFilter;
    const positionMatch = positionFilter === 'All' || cand.position === positionFilter;

    return searchMatch && statusMatch && positionMatch;
  });

  // Sorting logic
  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
    if (sortBy === 'oldest') {
      return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    }
    if (sortBy === 'name') {
      return a.first_name.localeCompare(b.first_name);
    }
    return 0;
  });

  return (
    <div className="pt-24 pb-20 px-6 bg-slate-50 min-h-screen flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        
        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight font-outfit">Candidates Directory</h1>
            <p className="text-slate-500 text-xs font-semibold mt-1">
              Screening, interviewing, and pipeline assignment management.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleClearAll}
              className="px-4 py-2 border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors"
            >
              Clear All Data
            </button>
            <button 
              onClick={handleOpenAdd}
              className="btn btn-primary shadow-lg shadow-indigo-600/10"
            >
              <Plus size={16} />
              <span>Add Candidate</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="surface-card bg-white p-6 mb-8 flex flex-col lg:flex-row items-center gap-4">
          {/* Search bar */}
          <div className="relative w-full lg:flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by candidate name, email, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 outline-none text-slate-800 font-medium placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all text-sm"
            />
          </div>
          
          {/* Drops */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            
            {/* Status filter */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-semibold w-full sm:w-auto">
              <Filter size={14} className="text-slate-400 shrink-0" />
              <span>Status:</span>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-slate-900 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Applied">Applied</option>
                <option value="Under Review">Under Review</option>
                <option value="Interview Scheduled">Interview Scheduled</option>
                <option value="Selected">Selected</option>
                <option value="Rejected">Rejected</option>
                <option value="Hired">Hired</option>
              </select>
            </div>

            {/* Position filter */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-semibold w-full sm:w-auto">
              <Briefcase size={14} className="text-slate-400 shrink-0" />
              <span>Job Role:</span>
              <select 
                value={positionFilter} 
                onChange={(e) => setPositionFilter(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-slate-900 cursor-pointer max-w-[150px] truncate"
              >
                {positionsList.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>

            {/* Sort by */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-semibold w-full sm:w-auto">
              <ChevronDown size={14} className="text-slate-400 shrink-0" />
              <span>Sort:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-slate-900 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>

          </div>
        </div>

        {/* Directory List */}
        <div className="surface-card bg-white overflow-hidden flex-1 shadow-lg shadow-slate-100/50">
          
          {/* Header Row */}
          <div className="hidden md:grid grid-cols-12 p-5 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
            <div className="col-span-4">Candidate & Profile</div>
            <div className="col-span-3">Applied Job & Source</div>
            <div className="col-span-3">Assigned TL & Manager</div>
            <div className="col-span-1.5 text-center">Status</div>
            <div className="col-span-0.5 text-right"></div>
          </div>

          {loading ? (
            <div className="py-32 text-center text-slate-400 font-bold animate-pulse">Gathering pipeline details...</div>
          ) : sortedCandidates.length === 0 ? (
            <div className="py-24 text-center text-slate-400">
              <Users size={48} className="mx-auto mb-4 text-slate-200" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">No matches found</h3>
              <p className="text-sm text-slate-500">Try tweaking your search, filters, or import some candidates.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sortedCandidates.map((cand) => (
                <div key={cand.id} className="grid grid-cols-1 md:grid-cols-12 p-5 items-center gap-4 hover:bg-slate-50/50 transition-colors group">
                  
                  {/* Candidate Column */}
                  <div className="col-span-1 md:col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                      {cand.first_name[0]}{cand.last_name ? cand.last_name[0] : ''}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{cand.first_name} {cand.last_name}</h4>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-0.5 text-xs text-slate-500">
                        {cand.email && <span className="flex items-center gap-1"><Mail size={12} className="text-slate-400" />{cand.email}</span>}
                        {cand.phone && <span className="flex items-center gap-1"><Phone size={12} className="text-slate-400" />{cand.phone}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Applied Job & Source */}
                  <div className="col-span-1 md:col-span-3">
                    <span className="font-bold text-slate-900 text-sm block">{cand.position}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">
                      {cand.source || 'Manual'}
                    </span>
                  </div>

                  {/* Assignments */}
                  <div className="col-span-1 md:col-span-3 text-xs text-slate-600">
                    <p className="font-semibold text-slate-700"><span className="text-[10px] text-slate-400 font-bold uppercase">TL:</span> {cand.assigned_tl || 'Unassigned'}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5"><span className="text-[10px] text-slate-400 font-bold uppercase">MGR:</span> {cand.assigned_manager || 'Unassigned'}</p>
                  </div>

                  {/* Status Badge */}
                  <div className="col-span-1 md:col-span-1.5 flex justify-start md:justify-center">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] inline-block ${
                      cand.status === 'Hired' ? 'bg-emerald-100 text-emerald-800' :
                      cand.status === 'Selected' ? 'bg-teal-100 text-teal-800' :
                      cand.status === 'Interview Scheduled' ? 'bg-amber-100 text-amber-800' :
                      cand.status === 'Under Review' ? 'bg-indigo-100 text-indigo-800' :
                      cand.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {cand.status}
                    </span>
                  </div>

                  {/* Actions Column */}
                  <div className="col-span-1 md:col-span-0.5 flex items-center justify-end gap-1">
                    <button 
                      onClick={() => handleOpenEdit(cand)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                      title="Edit / Schedule Interview"
                    >
                      <Edit size={15} />
                    </button>
                    <button 
                      onClick={() => handleDelete(cand.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
                      title="Delete Candidate"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* MODAL: ADD CANDIDATE */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 font-outfit">Add Candidate Manually</h3>
                <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
              </div>
              
              <form onSubmit={handleAddSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">First Name *</label>
                    <input type="text" name="first_name" required onChange={handleFormChange} value={candForm.first_name} className="input-field py-2 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Last Name</label>
                    <input type="text" name="last_name" onChange={handleFormChange} value={candForm.last_name} className="input-field py-2 text-sm" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Email Address *</label>
                  <input type="email" name="email" required onChange={handleFormChange} value={candForm.email} className="input-field py-2 text-sm" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Phone Number</label>
                  <input type="text" name="phone" onChange={handleFormChange} value={candForm.phone} className="input-field py-2 text-sm" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Applied Job Position *</label>
                  <input type="text" name="position" required onChange={handleFormChange} value={candForm.position} className="input-field py-2 text-sm" placeholder="e.g. Software Engineer" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Experience</label>
                    <input type="text" name="experience" onChange={handleFormChange} value={candForm.experience} className="input-field py-2 text-sm" placeholder="e.g. 3 years" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Initial Status</label>
                    <select name="status" onChange={handleFormChange} value={candForm.status} className="input-field py-2 text-sm">
                      <option value="Applied">Applied</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Interview Scheduled">Interview Scheduled</option>
                      <option value="Selected">Selected</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Hired">Hired</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Skills (comma separated)</label>
                  <input type="text" name="skills" onChange={handleFormChange} value={candForm.skills} className="input-field py-2 text-sm" placeholder="e.g. React, Node.js, Git" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">LinkedIn Profile URL</label>
                  <input type="text" name="linkedin_profile" onChange={handleFormChange} value={candForm.linkedin_profile} className="input-field py-2 text-sm" placeholder="https://linkedin.com/in/username" />
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Assign TL (Optional)</label>
                    <input type="text" name="assigned_tl" onChange={handleFormChange} value={candForm.assigned_tl} className="input-field py-2 text-sm bg-white" placeholder="Leave blank for auto-rule" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Assign Manager (Optional)</label>
                    <input type="text" name="assigned_manager" onChange={handleFormChange} value={candForm.assigned_manager} className="input-field py-2 text-sm bg-white" placeholder="Leave blank for auto-rule" />
                  </div>
                </div>

                {formError && <div className="text-xs font-semibold text-rose-500">{formError}</div>}
                
                <button type="submit" disabled={formSubmitting} className="btn btn-primary w-full py-3 text-sm">
                  {formSubmitting ? 'Saving...' : 'Create Candidate'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT CANDIDATE / INTERVIEW / FEEDBACK */}
      <AnimatePresence>
        {isEditOpen && selectedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                <div>
                  <h3 className="text-lg font-bold font-outfit">Edit Candidate File</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedCandidate.first_name} {selectedCandidate.last_name || ''}</p>
                </div>
                <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
              </div>
              
              <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-700">
                
                {/* 1. Core Profile Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-1.5">Profile Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">First Name</label>
                      <input type="text" name="first_name" required onChange={handleFormChange} value={candForm.first_name} className="input-field py-2 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">Last Name</label>
                      <input type="text" name="last_name" onChange={handleFormChange} value={candForm.last_name} className="input-field py-2 text-xs" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">Email Address</label>
                      <input type="email" name="email" required onChange={handleFormChange} value={candForm.email} className="input-field py-2 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">Phone</label>
                      <input type="text" name="phone" onChange={handleFormChange} value={candForm.phone} className="input-field py-2 text-xs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">Job Applied For</label>
                      <input type="text" name="position" required onChange={handleFormChange} value={candForm.position} className="input-field py-2 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">LinkedIn Profile</label>
                      <input type="text" name="linkedin_profile" onChange={handleFormChange} value={candForm.linkedin_profile} className="input-field py-2 text-xs" />
                    </div>
                  </div>
                </div>

                {/* 2. Staff Routing Assignments */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-1.5">Staff Routing & Pipeline</h4>
                  
                  <div className="grid grid-cols-3 gap-4 items-end">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">Assign Team Lead</label>
                      <input type="text" name="assigned_tl" onChange={handleFormChange} value={candForm.assigned_tl} className="input-field py-2 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">Assign Manager</label>
                      <input type="text" name="assigned_manager" onChange={handleFormChange} value={candForm.assigned_manager} className="input-field py-2 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">Pipeline Status</label>
                      <select name="status" onChange={handleFormChange} value={candForm.status} className="input-field py-2 text-xs font-bold bg-slate-50 border-slate-300">
                        <option value="Applied">Applied</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Interview Scheduled">Interview Scheduled</option>
                        <option value="Selected">Selected</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Hired">Hired</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Interview Scheduler */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar size={15} className="text-indigo-600" />
                    Schedule Interview
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">Date & Time</label>
                      <input 
                        type="datetime-local" 
                        name="interview_date" 
                        onChange={handleFormChange} 
                        value={candForm.interview_date} 
                        className="input-field py-2 text-xs bg-white" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">Interview Rating (Feedback)</label>
                      <div className="text-xs font-semibold text-slate-400 italic pt-2">
                        Set interview feedback details below.
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Interview Feedback */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-1.5">Interview Feedback & Notes</h4>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Feedback Summary</label>
                    <textarea 
                      name="interview_feedback" 
                      rows={3} 
                      onChange={handleFormChange} 
                      value={candForm.interview_feedback} 
                      className="input-field py-2 text-xs" 
                      placeholder="Enter technical interview details, strengths, weaknesses, and core recommendation..."
                    />
                  </div>
                </div>

                {formError && <div className="text-xs font-semibold text-rose-500">{formError}</div>}
                
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={formSubmitting} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/10">
                    {formSubmitting ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminCandidates;
