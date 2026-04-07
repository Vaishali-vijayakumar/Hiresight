import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  Users, Search, Filter, Download, ExternalLink, 
  Clock, CheckCircle, AlertCircle, FileText, ChevronRight
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
            <h1 className="text-4xl font-bold font-outfit mb-2">Talent Pipeline</h1>
            <p className="text-text-muted">Manage and review all incoming candidate intelligence.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 px-4 py-2 rounded-lg border border-primary/20 flex items-center gap-3">
              <Users className="text-primary" size={20} />
              <span className="font-bold">{resumes.length}</span>
              <span className="text-sm text-text-muted">Candidates</span>
            </div>
            <button className="btn btn-secondary flex items-center gap-2">
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="glass-card p-4 mb-8 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search candidates by name..."
              className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-primary/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary px-6">
            <Filter size={18} className="mr-2" />
            Filters
          </button>
        </div>

        {/* Talent List */}
        <div className="glass-card overflow-hidden">
          <div className="grid grid-cols-12 p-6 bg-white/5 border-b border-white/5 text-xs font-bold text-text-muted uppercase tracking-widest">
            <div className="col-span-4">Candidate</div>
            <div className="col-span-2 text-center">AI Score</div>
            <div className="col-span-3">Skills Status</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>
          
          {loading ? (
            <div className="p-20 text-center text-text-muted italic">Loading talent data...</div>
          ) : filteredResumes.length > 0 ? (
            <div className="divide-y divide-white/5">
              {filteredResumes.map((resume, idx) => (
                <motion.div 
                  key={resume.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="grid grid-cols-12 p-6 items-center hover:bg-white/10 transition-colors group"
                >
                  <div className="col-span-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-sm">
                      {resume.first_name[0]}{resume.last_name ? resume.last_name[0] : ''}
                    </div>
                    <div>
                      <h4 className="font-bold text-white group-hover:text-primary transition-colors">
                        {resume.first_name} {resume.last_name}
                      </h4>
                      <p className="text-xs text-text-muted flex items-center gap-1 mt-1">
                        <Clock size={12} /> {new Date(resume.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="col-span-2 flex flex-col items-center">
                    <span className="text-xl font-bold font-outfit text-white">88</span>
                    <span className="text-[10px] text-text-muted uppercase font-bold">Talent Index</span>
                  </div>

                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 w-[85%] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                      </div>
                      <span className="text-xs font-bold text-green-400">Match</span>
                    </div>
                  </div>

                  <div className="col-span-3 flex items-center justify-end gap-3">
                    <a 
                      href={resume.resume_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-white transition-all"
                      title="View PDF"
                    >
                      <FileText size={18} />
                    </a>
                    <button className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-primary transition-all">
                      <ExternalLink size={18} />
                    </button>
                    <button className="bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-lg transition-all ml-2">
                       <ChevronRight size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center text-text-muted">
              No candidates found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
