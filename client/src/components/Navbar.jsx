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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline group">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-md group-hover:bg-indigo-500 transition-colors">
            <Briefcase className="text-white" size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-slate-900 font-outfit leading-none">
              HireSight
            </span>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
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
                    ? 'text-indigo-600 bg-indigo-50' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/admin/candidates"
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all no-underline rounded-lg ${
                  path === '/admin/candidates' 
                    ? 'text-indigo-600 bg-indigo-50' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Users size={16} />
                <span>Candidates Pool</span>
              </Link>
              <Link
                to="/admin/upload"
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all no-underline rounded-lg ${
                  path === '/admin/upload' 
                    ? 'text-indigo-600 bg-indigo-50' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
                  ? 'text-pink-600 bg-pink-50' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white rounded-lg transition-all no-underline shadow-sm"
            >
              <ArrowRightLeft size={14} />
              <span>Switch to Candidate Portal</span>
            </Link>
          ) : isCandidatePortal ? (
            <Link
              to="/admin"
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all no-underline shadow-sm"
            >
              <ArrowRightLeft size={14} />
              <span>Switch to HR Admin Portal</span>
            </Link>
          ) : (
            <div className="flex gap-2">
              <Link
                to="/admin"
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors no-underline"
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
