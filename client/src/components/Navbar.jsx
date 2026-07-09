import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Briefcase, LayoutDashboard, Users, FileSpreadsheet, FileText, ArrowRightLeft } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const path = location.pathname;

  // Determine current portal context
  const isAdminPortal = path.startsWith('/admin');
  const isCandidatePortal = path.startsWith('/candidate');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline group">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-md group-hover:bg-indigo-500 transition-colors">
            <Briefcase className="text-white" size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-white font-outfit leading-none">
              HireSight
            </span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Recruitment Suite
            </span>
          </div>
        </Link>
        
        {/* Navigation Tabs depending on context */}
        <div className="flex items-center gap-1">
          {isAdminPortal && (
            <>
              <Link
                to="/admin"
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all no-underline rounded-lg ${
                  path === '/admin' 
                    ? 'text-indigo-400 bg-indigo-500/10' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/admin/candidates"
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all no-underline rounded-lg ${
                  path === '/admin/candidates' 
                    ? 'text-indigo-400 bg-indigo-500/10' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users size={16} />
                <span>Candidates Pool</span>
              </Link>
              <Link
                to="/admin/upload"
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all no-underline rounded-lg ${
                  path === '/admin/upload' 
                    ? 'text-indigo-400 bg-indigo-500/10' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileSpreadsheet size={16} />
                <span>Upload CSV</span>
              </Link>
            </>
          )}

          {isCandidatePortal && (
            <Link
              to="/candidate"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all no-underline rounded-lg ${
                path === '/candidate' 
                  ? 'text-pink-400 bg-pink-500/10' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText size={16} />
              <span>ATS Resume Builder</span>
            </Link>
          )}
        </div>

        {/* Quick Portal Switcher */}
        <div>
          {isAdminPortal ? (
            <Link
              to="/candidate"
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white rounded-lg transition-all no-underline shadow-lg shadow-pink-600/20"
            >
              <ArrowRightLeft size={14} />
              <span>Switch to Candidate Portal</span>
            </Link>
          ) : isCandidatePortal ? (
            <Link
              to="/admin"
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all no-underline shadow-lg shadow-indigo-600/20"
            >
              <ArrowRightLeft size={14} />
              <span>Switch to HR Admin Portal</span>
            </Link>
          ) : (
            <div className="flex gap-2">
              <Link
                to="/admin"
                className="px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors no-underline"
              >
                HR Portal
              </Link>
              <Link
                to="/candidate"
                className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all no-underline"
              >
                Resume Builder
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
