import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Upload, Database, Home } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/upload', label: 'Upload', icon: Upload },
    { path: '/dashboard', label: 'Dashboard', icon: Database },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto glass-card flex items-center justify-between px-8 py-3">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="bg-primary p-2 rounded-lg">
            <Layout className="text-white" size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white font-outfit">
            HireSight<span className="text-primary">.</span>
          </span>
        </Link>
        
        <div className="flex items-center gap-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 text-sm font-medium transition-colors no-underline ${
                  isActive ? 'text-primary' : 'text-text-muted hover:text-white'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
