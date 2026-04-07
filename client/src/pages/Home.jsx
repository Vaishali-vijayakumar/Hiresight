import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, BrainCircuit, BarChart3, Clock8, ArrowRight } from 'lucide-react';

const Home = () => {
  return (
    <div className="pt-24 pb-20">
      {/* Hero Section */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <motion.h1 
            className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight text-slate-900 leading-[1.1]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Hiring intelligent teams <br />
            <span className="text-primary">just got simpler.</span>
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Analyze thousands of resumes in seconds with professional NLP. 
            Identify top-tier candidates without the bias of traditional screening.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Link to="/upload" className="btn btn-primary px-10 py-4 text-base shadow-lg shadow-blue-500/20 no-underline">
              Upload Resume
            </Link>
            <Link to="/dashboard" className="btn btn-secondary px-10 py-4 text-base no-underline">
              Browse Candidates
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats/Logo Section */}
      <section className="px-6 py-12 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-8 md:gap-20 opacity-60 grayscale">
          <span className="font-bold text-slate-900 text-xl tracking-tighter">TECHCORP</span>
          <span className="font-bold text-slate-900 text-xl tracking-tighter">CLOUDSCALE</span>
          <span className="font-bold text-slate-900 text-xl tracking-tighter">DATAWAVE</span>
          <span className="font-bold text-slate-900 text-xl tracking-tighter">INNOLABS</span>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <Feature 
            icon={<Search className="text-primary" />}
            title="Semantic Search"
            desc="Locate candidates based on skills context, not just keyword matches."
          />
          <Feature 
            icon={<BrainCircuit className="text-primary" />}
            title="Entity Extraction"
            desc="Automatically pull experience levels, tools, and certifications."
          />
          <Feature 
            icon={<BarChart3 className="text-primary" />}
            title="Visual Analytics"
            desc="Track your pipeline conversion and talent density in real-time."
          />
        </div>
      </section>

      {/* Minimal CTA */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto surface-card p-12 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-bold mb-2 text-white">Ready to streamline?</h2>
            <p className="text-slate-400">Join 500+ teams using HireSight today.</p>
          </div>
          <Link to="/upload" className="btn bg-white text-slate-900 hover:bg-slate-100 px-8 py-3 no-underline flex items-center gap-2">
            Get Started <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
};

const Feature = ({ icon, title, desc }) => (
  <div className="flex flex-col gap-4">
    <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center p-2">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-800">{title}</h3>
    <p className="text-slate-600 leading-relaxed text-sm">{desc}</p>
  </div>
);

export default Home;
