import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileSearch, Sparkles, ShieldCheck, Zap } from 'lucide-react';

const Home = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="pt-32 px-6 min-h-screen">
      <div className="max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 inline-block px-4 py-1.5 glass-card text-sm font-medium text-accent border-accent/20"
        >
          ✨ AI-Powered Hiring Evolution
        </motion.div>
        
        <motion.h1 
          className="text-6xl md:text-8xl font-bold mb-8 tracking-tight font-outfit"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          Revolutionize Your <br />
          <span className="vibrant-gradient-text">Hiring Pipeline</span>
        </motion.h1>
        
        <motion.p 
          className="text-xl text-text-muted max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          HireSight uses advanced NLP to analyze resumes, extract skills, and rank candidates 
          with surgical precision. Save hundreds of hours in screening.
        </motion.p>
        
        <motion.div 
          className="flex items-center justify-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Link to="/upload" className="btn btn-primary text-lg px-10 py-4 no-underline">
            Get Started Free
          </Link>
          <Link to="/dashboard" className="btn btn-secondary text-lg px-10 py-4 no-underline">
            View Analytics
          </Link>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-32"
        >
          <FeatureCard 
            icon={<Sparkles className="text-primary" />}
            title="AI Analysis"
            desc="Deep talent extraction using cutting-edge sentiment and entity analysis."
          />
          <FeatureCard 
            icon={<FileSearch className="text-secondary" />}
            title="Resume Ranking"
            desc="Automated scoring based on skills, experience, and tone matching."
          />
          <FeatureCard 
            icon={<Zap className="text-accent" />}
            title="Real-time Stats"
            desc="Interactive dashboard with live updates on your hiring pipeline."
          />
          <FeatureCard 
            icon={<ShieldCheck className="text-green-400" />}
            title="Secure Storage"
            desc="Bank-grade encryption for all candidate data and file storage."
          />
        </motion.div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <motion.div 
    variants={{
      hidden: { y: 20, opacity: 0 },
      visible: { y: 0, opacity: 1 }
    }}
    className="glass-card p-8 text-left hover:scale-105 transition-transform cursor-default group"
  >
    <div className="bg-white/5 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-text-muted text-sm leading-relaxed">{desc}</p>
  </motion.div>
);

export default Home;
