import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import UploadPage from './pages/Upload';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-bg-subtle text-text-main antialiased selection:bg-blue-100 selection:text-blue-900">
        <Navbar />
        <main className="relative z-10 w-full mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
        
        <footer className="py-16 text-center text-text-muted text-sm border-t border-slate-200 mt-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <p className="font-semibold text-slate-800 mb-2 font-outfit uppercase tracking-wider text-xs">HireSight Intelligence</p>
            <p>© 2026 Professional Talent Analysis. Built for modern high-growth teams.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
