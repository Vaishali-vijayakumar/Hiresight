import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import AdminCandidates from './pages/AdminCandidates';
import AdminUpload from './pages/AdminUpload';
import CandidatePortal from './pages/CandidatePortal';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
        <Navbar />
        <main className="relative z-10 w-full flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            
            {/* HR Admin Portal */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/candidates" element={<AdminCandidates />} />
            <Route path="/admin/upload" element={<AdminUpload />} />
            
            {/* Candidate Portal */}
            <Route path="/candidate" element={<CandidatePortal />} />
          </Routes>
        </main>
        
        <footer className="py-8 text-center text-slate-500 text-xs border-t border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <p className="font-semibold text-slate-700 mb-1 font-outfit uppercase tracking-widest text-[10px]">HireSight Enterprise</p>
            <p>© 2026 HireSight Recruitment Suite. Unified Candidate Experience & HR Intelligence.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
