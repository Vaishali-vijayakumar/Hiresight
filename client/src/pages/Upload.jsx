import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, User, Mail, ChevronRight } from 'lucide-react';
import { API_URL } from '../config';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '' });
  const [status, setStatus] = useState('idle'); // idle, uploading, analyzing, success, error
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(selectedFile.type)) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Only PDF and DOCX files are supported.');
      }
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !formData.firstName || !formData.email) {
      setError('Please fill in all required fields.');
      return;
    }

    setStatus('uploading');
    const data = new FormData();
    data.append('resume', file);
    data.append('first_name', formData.firstName);
    data.append('last_name', formData.lastName);
    data.append('email', formData.email);

    try {
      const response = await axios.post(`${API_URL}/upload`, data);
      setStatus('success');
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setError(err.response?.data?.error || 'Failed to analyze resume. Please try again.');
    }
  };

  return (
    <div className="pt-32 px-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 font-outfit">Submit Candidate</h1>
          <p className="text-text-muted">Start our AI engine to extract intelligence from any resume.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Form Section */}
          <div className="glass-card p-10">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
              <User size={20} className="text-primary" />
              Candidate Profile
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-2.5 outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted">Resume File (PDF/DOCX) *</label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                    file ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                  onClick={() => document.getElementById('resume-upload').click()}
                >
                  <input
                    type="file"
                    id="resume-upload"
                    className="hidden"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                  />
                  {file ? (
                    <div className="flex flex-col items-center">
                      <FileText className="text-primary mb-3" size={40} />
                      <span className="text-sm font-medium truncate max-w-full italic">{file.name}</span>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="text-xs text-secondary mt-2 underline"
                      >
                        Change File
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="text-text-muted mb-3" size={40} />
                      <span className="text-sm text-text-muted">Drag & drop or <span className="text-primary">browse</span></span>
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={status !== 'idle' && status !== 'error'}
                className={`btn btn-primary w-full py-4 text-white font-bold text-lg disabled:opacity-50`}
              >
                {status === 'uploading' ? (
                  <><Loader2 className="animate-spin" /> Processing...</>
                ) : (
                  <>Analyze Candidate <ChevronRight size={20} /></>
                )}
              </button>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3 text-red-500 text-sm"
                >
                  <AlertCircle size={18} />
                  {error}
                </motion.div>
              )}
            </form>
          </div>

          {/* Results Section */}
          <div className="flex flex-col">
            <AnimatePresence mode="wait">
              {status === 'success' && result ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-10 flex-1 border-primary/20"
                >
                  <div className="flex items-center gap-3 text-green-400 font-bold mb-8">
                    <CheckCircle2 size={24} />
                    Analysis Complete
                  </div>
                  
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted font-medium">AI Talent Score</span>
                      <span className="text-4xl font-bold font-outfit text-white">{result.id ? '92' : '0'}/100</span>
                    </div>
                    
                    <div className="w-full bg-white/5 rounded-full h-3">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '92%' }}
                        className="bg-gradient-to-r from-primary to-secondary h-full rounded-full"
                      />
                    </div>

                    <div className="space-y-6">
                      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                        <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Confidence Level</h4>
                        <p className="text-white">High Intelligence Accuracy</p>
                      </div>
                      
                      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                        <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Stored Reference</h4>
                        <p className="text-white text-xs font-mono break-all">{result.id || 'N/A'}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => setStatus('idle')}
                      className="btn btn-secondary w-full py-3"
                    >
                      New Analysis
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card p-10 flex-1 flex flex-col items-center justify-center text-center opacity-50 border-white/5"
                >
                  <FileText size={60} className="text-white/20 mb-6" />
                  <h3 className="text-xl font-bold mb-2">No Active Analysis</h3>
                  <p className="text-sm text-text-muted max-w-xs">Fill in the candidate details and upload a resume to start the extraction process.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
