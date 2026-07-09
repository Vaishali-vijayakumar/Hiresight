import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldCheck, UserCheck, Sparkles, FileText, UploadCloud, Users, Layers, Award } from 'lucide-react';

const Home = () => {
  return (
    <div className="pt-24 pb-20 min-h-screen bg-slate-950 text-white flex flex-col justify-center px-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full relative z-10">
        
        {/* Header Title */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6"
          >
            <Sparkles size={12} />
            <span>AI-Driven Recruitment Suite</span>
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl font-black mb-6 tracking-tight font-outfit"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Welcome to <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">HireSight</span>
          </motion.h1>
          
          <motion.p 
            className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            A dual-engine platform designed to streamline hiring workflows for HR teams and optimize interview outcomes for candidates. Select your entry portal below.
          </motion.p>
        </div>

        {/* Portal Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
          
          {/* HR Admin Card */}
          <motion.div
            className="relative group bg-slate-900/40 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-8 lg:p-10 flex flex-col justify-between transition-all duration-300 backdrop-blur-sm overflow-hidden"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -5 }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-600/20 transition-all"></div>
            <div>
              <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 mb-8 group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <h2 className="text-2xl font-bold font-outfit mb-3 text-white">HR Admin Workspace</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Upload multiple candidate profiles via CSV lists, structure automated screening workflows, assign applicants to designated managers, and track interview progress within a visual pipeline.
              </p>
              
              {/* Features List */}
              <ul className="space-y-4 mb-10 text-xs text-slate-300">
                <li className="flex items-center gap-3">
                  <UploadCloud size={16} className="text-indigo-400 shrink-0" />
                  <span>LinkedIn CSV Candidate Bulk Import</span>
                </li>
                <li className="flex items-center gap-3">
                  <Layers size={16} className="text-indigo-400 shrink-0" />
                  <span>Auto-assignment of Team Lead & Manager</span>
                </li>
                <li className="flex items-center gap-3">
                  <Users size={16} className="text-indigo-400 shrink-0" />
                  <span>Interview scheduling & feedback collection</span>
                </li>
              </ul>
            </div>
            
            <Link 
              to="/admin" 
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-center rounded-xl transition-all duration-300 no-underline shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              <span>Access HR Workspace</span>
              <UserCheck size={16} />
            </Link>
          </motion.div>

          {/* Candidate Card */}
          <motion.div
            className="relative group bg-slate-900/40 border border-slate-800 hover:border-pink-500/50 rounded-2xl p-8 lg:p-10 flex flex-col justify-between transition-all duration-300 backdrop-blur-sm overflow-hidden"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -5 }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-pink-600/20 transition-all"></div>
            <div>
              <div className="w-12 h-12 bg-pink-500/10 border border-pink-500/20 rounded-xl flex items-center justify-center text-pink-400 mb-8 group-hover:scale-110 transition-transform">
                <Sparkles size={24} />
              </div>
              <h2 className="text-2xl font-bold font-outfit mb-3 text-white">Candidate ATS Hub</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Build your professional resume step-by-step using an interactive builder, score it against target job requirements, obtain keyword optimization suggestions, and download a polished PDF layout.
              </p>
              
              {/* Features List */}
              <ul className="space-y-4 mb-10 text-xs text-slate-300">
                <li className="flex items-center gap-3">
                  <FileText size={16} className="text-pink-400 shrink-0" />
                  <span>Interactive resume formatting form</span>
                </li>
                <li className="flex items-center gap-3">
                  <Award size={16} className="text-pink-400 shrink-0" />
                  <span>Real-time ATS suitability scoring (0-100)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Sparkles size={16} className="text-pink-400 shrink-0" />
                  <span>Tailored keyword and phrasing suggestions</span>
                </li>
              </ul>
            </div>
            
            <Link 
              to="/candidate" 
              className="w-full py-4 bg-pink-600 hover:bg-pink-500 text-white font-bold text-center rounded-xl transition-all duration-300 no-underline shadow-lg shadow-pink-600/20 flex items-center justify-center gap-2"
            >
              <span>Build ATS Resume</span>
              <FileText size={16} />
            </Link>
          </motion.div>

        </div>

      </div>
    </div>
  );
};

export default Home;
