import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import UploadPage from './pages/Upload';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen relative overflow-hidden">
        {/* Background blobs for premium feel */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-secondary/10 rounded-full blur-[80px] pointer-events-none" />
        
        <Navbar />
        
        <main className="relative z-10 w-full mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
        
        <footer className="relative z-10 py-12 text-center text-text-muted text-sm border-t border-white/5 mt-20">
          <p>© 2026 HireSight Intelligence. Built for high-velocity recruiting.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
