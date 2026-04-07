import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  FileUp, FileCheck, CheckCircle2, AlertCircle, 
  Loader2, User, Mail, ChevronRight, FileText, ArrowLeft
} from 'lucide-react';
import { API_URL } from '../config';
import { Link } from 'react-router-dom';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '' });
  const [status, setStatus] = useState('idle'); 
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(selectedFile.type)) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please upload a PDF or DOCX file.');
      }
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !formData.firstName || !formData.email) {
      setError('Required fields are missing.');
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
      setError(err.response?.data?.error || 'Analysis failed. Please try again.');
    }
  };

  return (
    <div className="pt-32 px-6 pb-20">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
            <Link to="/" className="text-sm font-semibold text-primary flex items-center gap-1 mb-6 hover:gap-2 transition-all no-underline">
                <ArrowLeft size={16} /> Back to center
            </Link>
          <h1 className="text-4xl font-extrabold mb-3 text-slate-900 tracking-tight">Onboard Candidate</h1>
          <p className="text-slate-600">Enter candidate details and upload their resume for professional indexing.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Form Section */}
          <div className="lg:col-span-3 surface-card p-10 bg-white">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">First Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    placeholder="e.g. John"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="e.g. Doe"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Email Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="john.doe@company.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field pl-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Upload Resume <span className="text-red-500">*</span></label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
                    file ? 'border-primary bg-blue-50/50' : 'border-slate-200 hover:border-primary hover:bg-slate-50'
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
                      <div className="bg-primary/10 p-3 rounded-full mb-4">
                        <FileCheck className="text-primary" size={28} />
                      </div>
                      <span className="text-sm font-bold text-slate-800 truncate max-w-full italic mb-2">{file.name}</span>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors"
                      >
                        Remove selection
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="bg-slate-100 p-3 rounded-full mb-4">
                        <FileUp className="text-slate-500" size={28} />
                      </div>
                      <span className="text-sm text-slate-600">Click to browse or <span className="text-primary font-bold">drag files here</span></span>
                      <span className="text-xs text-slate-400 mt-2">Support for PDF and DOCX only</span>
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
                  <><Loader2 className="animate-spin" /> Analyzing Talent...</>
                ) : (
                  <>Process Candidate <ChevronRight size={18} /></>
                )}
              </button>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-center gap-3 text-red-600 text-sm font-medium"
                >
                  <AlertCircle size={18} />
                  {error}
                </motion.div>
              )}
            </form>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <AnimatePresence mode="wait">
              {status === 'success' && result ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="surface-card p-10 bg-slate-900 text-white"
                >
                  <div className="flex items-center gap-3 text-green-400 font-bold mb-10 pb-6 border-b border-white/10">
                    <CheckCircle2 size={24} />
                    Ready for Review
                  </div>
                  
                  <div className="space-y-10">
                    <div className="text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Talent Fit Index</p>
                        <span className="text-6xl font-black font-outfit text-white">92<span className="text-slate-500">/100</span></span>
                    </div>
                    
                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold text-slate-400">Pipeline Status</span>
                            <span className="bg-green-500/20 text-green-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Top Tier</span>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-200">The candidate shows strong alignment with industry benchmarks and core skills requirements.</p>
                    </div>

                    <div className="pt-4 space-y-4">
                        <button 
                            onClick={() => window.location.href='/dashboard'}
                            className="btn btn-primary w-full py-3"
                        >
                            View in Dashboard
                        </button>
                        <button 
                            onClick={() => setStatus('idle')}
                            className="bg-transparent text-slate-400 hover:text-white text-sm font-bold w-full transition-colors"
                        >
                            Start New Upload
                        </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="surface-card p-10 bg-white flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                    <FileText size={32} className="text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Awaiting Data</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Submit the form on the left to start the AI analysis engine. 
                    Detailed reports will appear here in real-time.
                  </p>
                </div>
              )}
            </AnimatePresence>
            
            {/* Helpful Box */}
            <div className="surface-card p-8 bg-blue-50 border-blue-100">
                <h4 className="text-blue-900 font-bold mb-2 flex items-center gap-2">
                    <CheckCircle2 size={18} /> Best Practices
                </h4>
                <ul className="text-sm text-blue-700/80 space-y-2 list-disc pl-4">
                    <li>Use original PDF source files when possible.</li>
                    <li>Ensure candidate email is unique in our system.</li>
                    <li>Verify analysis results before saving to DB.</li>
                </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
