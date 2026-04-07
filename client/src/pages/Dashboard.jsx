import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  Users, Search, Filter, Download, ExternalLink, 
  Clock, CheckCircle, AlertCircle, FileText, ChevronRight, CheckCircle2
} from 'lucide-react';
import { API_URL } from '../config';

const Dashboard = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const response = await axios.get(`${API_URL}/resumes`);
        setResumes(response.data);
      } catch (err) {
        console.error('Error fetching resumes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResumes();
  }, []);

  const filteredResumes = resumes.filter(r => 
    `${r.first_name} ${r.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pt-32 px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Talent Pool</h1>
            <p className="text-slate-600 font-medium">You have {resumes.length} total candidates in your pipeline.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="btn btn-secondary shadow-sm">
              <Download size={18} /> Export Results
            </button>
            <button className="btn btn-primary shadow-lg shadow-blue-500/20">
               + New Onboard
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white border-y border-slate-100 p-8 flex flex-col md:flex-row items-center gap-6 mb-8">
            <div className="relative flex-1 group">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                <input 
                type="text" 
                placeholder="Search candidates by name..."
                className="w-full bg-transparent border-none pl-10 pr-4 py-3 outline-none text-slate-900 font-semibold placeholder:text-slate-300 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-4 text-sm font-bold text-slate-500">
                <Filter size={18} /> 
                <span className="cursor-pointer hover:text-slate-900 transition-colors">Date Added</span>
                <span className="cursor-pointer hover:text-slate-900 transition-colors">Talent Score</span>
                <span className="cursor-pointer hover:text-slate-900 transition-colors">Email</span>
            </div>
        </div>

        {/* Candidate List Table */}
        <div className="surface-card bg-white overflow-hidden border-none shadow-xl shadow-slate-100">
          <div className="grid grid-cols-12 p-6 border-b border-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
            <div className="col-span-5">Identification</div>
            <div className="col-span-2 text-center">Talent index</div>
            <div className="col-span-3">Skills alignment</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          
          <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="p-32 text-center text-slate-400 animate-pulse font-bold italic">Gathering recruitment intelligence...</div>
          ) : filteredResumes.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {filteredResumes.map((resume, idx) => (
                <motion.div 
                  key={resume.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: idx * 0.03 }}
                  className="grid grid-cols-12 p-6 items-center hover:bg-slate-50/50 transition-all group"
                >
                  <div className="col-span-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-600 text-sm border-2 border-white shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                      {resume.first_name[0]}{resume.last_name ? resume.last_name[0] : ''}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors mb-0.5">
                        {resume.first_name} {resume.last_name}
                      </h4>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                            <Clock size={12} /> {new Date(resume.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                            <Mail size={12} /> {resume.email}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-2 flex flex-col items-center">
                    <span className="text-2xl font-black font-outfit text-slate-900">92</span>
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Score</span>
                  </div>

                  <div className="col-span-3 pr-8">
                    <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-[88%] rounded-full"></div>
                        </div>
                        <CheckCircle2 size={16} className="text-green-500" />
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <a 
                      href={resume.resume_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2.5 hover:bg-white rounded-lg text-slate-400 hover:text-primary transition-all border border-transparent hover:border-slate-100 shadow-sm"
                      title="Download PDF"
                    >
                      <Download size={18} />
                    </a>
                    <button className="p-2.5 hover:bg-white rounded-lg text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100 shadow-sm">
                      <ExternalLink size={18} />
                    </button>
                    <button className="btn bg-slate-900 hover:bg-black text-white p-2 rounded-lg ml-2 shadow-lg shadow-black/5">
                       <ChevronRight size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-32 text-center text-slate-500 flex flex-col items-center bg-white">
              <Users size={60} className="text-slate-100 mb-6" />
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Empty Records</h3>
              <p className="text-slate-500 font-medium">No candidates currently matching your search criteria.</p>
            </div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
