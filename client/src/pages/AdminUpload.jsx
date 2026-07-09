import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  UploadCloud, FileCheck, CheckCircle2, AlertCircle, Loader2, 
  ArrowLeft, Users, FileSpreadsheet, ChevronRight, Clipboard, HelpCircle
} from 'lucide-react';
import { API_URL } from '../config';

const AdminUpload = () => {
  const navigate = useNavigate();
  const [csvText, setCsvText] = useState('');
  const [file, setFile] = useState(null);
  const [parsedCandidates, setParsedCandidates] = useState([]);
  const [status, setStatus] = useState('idle'); // idle, parsed, uploading, success, error
  const [error, setError] = useState('');
  const [importCount, setImportCount] = useState(0);

  // Simple CSV Parser
  const parseCSVContent = (text) => {
    try {
      if (!text.trim()) return [];
      
      const lines = text.split(/\r?\n/);
      if (lines.length < 2) {
        throw new Error('CSV must contain a header row and at least one data row.');
      }

      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
      
      const candidates = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split by comma, taking care of basic quotes
        const values = [];
        let currentVal = '';
        let insideQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"' || char === "'") {
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            values.push(currentVal.trim().replace(/['"]/g, ''));
            currentVal = '';
          } else {
            currentVal += char;
          }
        }
        values.push(currentVal.trim().replace(/['"]/g, ''));

        if (values.length < headers.length) continue;

        const candidate = {};
        headers.forEach((header, index) => {
          const val = values[index] || '';
          
          if (header.includes('first') || header === 'name') {
            candidate.first_name = val;
          } else if (header.includes('last')) {
            candidate.last_name = val;
          } else if (header.includes('email')) {
            candidate.email = val;
          } else if (header.includes('phone') || header === 'mobile') {
            candidate.phone = val;
          } else if (header.includes('position') || header.includes('job') || header.includes('role') || header === 'title') {
            candidate.position = val;
          } else if (header.includes('experience') || header.includes('exp')) {
            candidate.experience = val;
          } else if (header.includes('skill')) {
            candidate.skills = val;
          } else if (header.includes('linkedin') || header.includes('url') || header.includes('profile')) {
            candidate.linkedin_profile = val;
          }
        });

        // Fallbacks
        if (!candidate.first_name) {
          candidate.first_name = 'Candidate';
        }
        if (!candidate.position) {
          candidate.position = 'Software Engineer';
        }

        candidates.push(candidate);
      }

      return candidates;
    } catch (e) {
      setError(e.message || 'Failed to parse CSV. Make sure fields are separated by commas.');
      return [];
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.csv') || selectedFile.type === 'text/csv') {
        setFile(selectedFile);
        setError('');
        
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target.result;
          const candidates = parseCSVContent(text);
          if (candidates.length > 0) {
            setParsedCandidates(candidates);
            setStatus('parsed');
          }
        };
        reader.readAsText(selectedFile);
      } else {
        setError('Please upload a valid CSV file.');
      }
    }
  };

  const handlePasteChange = (e) => {
    setCsvText(e.target.value);
  };

  const handlePasteSubmit = () => {
    setError('');
    const candidates = parseCSVContent(csvText);
    if (candidates.length > 0) {
      setParsedCandidates(candidates);
      setStatus('parsed');
    } else {
      setError('No candidates parsed. Check header and values format.');
    }
  };

  const handleImport = async () => {
    if (parsedCandidates.length === 0) return;
    setStatus('uploading');
    
    try {
      const response = await axios.post(`${API_URL}/candidates/bulk`, { candidates: parsedCandidates });
      setImportCount(response.data.count);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setError(err.response?.data?.error || 'Bulk upload failed. Please try again.');
    }
  };

  const loadSampleCSV = () => {
    const sample = `First Name,Last Name,Email,Phone,Position,Experience,Skills,LinkedIn Profile
Alexander,Hamilton,alex@hamilton.org,+15550011,Software Engineer,4 years,"React, Node.js, SQL",linkedin.com/in/alexhamilton
Eliza,Schuyler,eliza@schuyler.com,+15550022,Frontend Developer,2 years,"HTML, CSS, React, TypeScript",linkedin.com/in/elizaschuyler
Aaron,Burr,aaron.burr@ny.gov,+15550033,Backend Developer,6 years,"Python, Django, PostgreSQL, Docker",linkedin.com/in/aaronburr
Angelica,Schuyler,angelica@schuyler.com,+15550044,Product Manager,5 years,"Agile, Scrum, Strategy, Jira",linkedin.com/in/angelicaschuyler`;
    setCsvText(sample);
    setError('');
  };

  return (
    <div className="pt-24 pb-20 px-6 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto w-full">
        
        {/* Back Link */}
        <div className="mb-6">
          <button 
            onClick={() => navigate('/admin')}
            className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>

        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight font-outfit">CSV Bulk Ingestion</h1>
          <p className="text-slate-500 text-xs font-semibold mt-1">
            Import candidates exported from LinkedIn Recruiter, Indeed, or other platforms.
          </p>
        </div>

        <AnimatePresence mode="wait">
          
          {/* SUCCESS STATUS */}
          {status === 'success' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="surface-card p-10 bg-slate-900 text-white text-center flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-2xl font-bold font-outfit mb-3">Bulk Ingestion Completed!</h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">
                Successfully processed and imported <span className="text-white font-bold">{importCount} candidates</span> into your Talent Pool. Appropriate managers and team leads have been assigned.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => navigate('/admin/candidates')}
                  className="btn btn-primary"
                >
                  View Candidate Pool
                </button>
                <button 
                  onClick={() => { setStatus('idle'); setParsedCandidates([]); setFile(null); setCsvText(''); }}
                  className="btn btn-secondary bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
                >
                  Upload Another File
                </button>
              </div>
            </motion.div>
          )}

          {/* PARSED PREVIEW STATUS */}
          {status === 'parsed' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="surface-card bg-white p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shrink-0">
                    <FileSpreadsheet size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 font-outfit">Parsed Candidates List</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Ready to import <span className="text-indigo-600 font-black">{parsedCandidates.length} profiles</span>. Verify assignments below.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => { setStatus('idle'); setParsedCandidates([]); }}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleImport}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/10 flex items-center gap-1.5"
                  >
                    <span>Confirm & Import ({parsedCandidates.length})</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Candidates Grid Table */}
              <div className="surface-card bg-white overflow-hidden shadow-md shadow-slate-100/50">
                <div className="grid grid-cols-12 p-4 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                  <div className="col-span-3">Candidate Name</div>
                  <div className="col-span-3">Email Address</div>
                  <div className="col-span-3">Position</div>
                  <div className="col-span-3">Skills preview</div>
                </div>

                <div className="divide-y divide-slate-100 max-h-[450px] overflow-y-auto">
                  {parsedCandidates.map((c, i) => (
                    <div key={i} className="grid grid-cols-12 p-4 items-center text-xs text-slate-700">
                      <div className="col-span-3 font-bold text-slate-900">{c.first_name} {c.last_name || ''}</div>
                      <div className="col-span-3 truncate text-slate-500">{c.email || 'N/A'}</div>
                      <div className="col-span-3 font-semibold text-slate-800">{c.position}</div>
                      <div className="col-span-3 truncate text-slate-400 font-medium">{c.skills || 'N/A'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* IDLE / CHOOSE INPUT METHOD */}
          {status !== 'success' && status !== 'parsed' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-8"
            >
              {/* File Upload Zone */}
              <div className="lg:col-span-3 surface-card p-8 bg-white flex flex-col justify-between min-h-[350px]">
                <div>
                  <h3 className="text-base font-bold text-slate-800 font-outfit mb-2 flex items-center gap-2">
                    <UploadCloud size={18} className="text-indigo-600" />
                    Upload CSV Document
                  </h3>
                  <p className="text-slate-500 text-xs mb-6">
                    Drop a standard CSV spreadsheet or LinkedIn candidate export file.
                  </p>
                  
                  {/* Drop zone */}
                  <div 
                    className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-xl p-8 text-center transition-all cursor-pointer bg-slate-50 hover:bg-slate-50/50 flex flex-col items-center justify-center min-h-[180px]"
                    onClick={() => document.getElementById('csv-file').click()}
                  >
                    <input 
                      type="file" 
                      id="csv-file" 
                      accept=".csv" 
                      className="hidden" 
                      onChange={handleFileChange} 
                    />
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-slate-400 mb-4">
                      <FileSpreadsheet size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-800">Click to browse or drag file here</p>
                    <p className="text-[10px] text-slate-400 mt-1">Supports spreadsheet files (.csv)</p>
                  </div>
                </div>

                {status === 'uploading' && (
                  <div className="mt-4 flex items-center gap-2 text-indigo-600 text-xs font-bold justify-center">
                    <Loader2 className="animate-spin" size={16} />
                    Importing talent database...
                  </div>
                )}

                {error && (
                  <div className="mt-4 bg-rose-50 border border-rose-100 rounded-lg p-3 text-rose-600 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
              </div>

              {/* Raw CSV Text Paste */}
              <div className="lg:col-span-2 surface-card p-8 bg-white flex flex-col justify-between min-h-[350px]">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-bold text-slate-800 font-outfit flex items-center gap-2">
                      <Clipboard size={18} className="text-indigo-600" />
                      Paste CSV Content
                    </h3>
                    <button 
                      onClick={loadSampleCSV}
                      className="text-[10px] font-bold text-indigo-600 hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Load Sample
                    </button>
                  </div>
                  <textarea 
                    rows={8}
                    value={csvText}
                    onChange={handlePasteChange}
                    placeholder="First Name,Last Name,Email,Position,Experience&#10;John,Doe,john@example.com,Backend Developer,4 years&#10;Jane,Smith,jane@example.com,Frontend Developer,2 years"
                    className="input-field text-xs font-mono bg-slate-50 resize-none h-[180px]"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button 
                    onClick={handlePasteSubmit}
                    disabled={!csvText.trim()}
                    className="btn btn-primary w-full py-2.5 text-xs font-bold disabled:opacity-50"
                  >
                    Parse Paste Data
                  </button>
                </div>
              </div>

              {/* Guidelines helper box */}
              <div className="lg:col-span-5 surface-card p-6 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-800 rounded-xl text-indigo-400 shrink-0">
                    <HelpCircle size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white font-outfit">CSV Header Requirements</h4>
                    <p className="text-slate-400 text-xs mt-0.5 max-w-2xl leading-relaxed">
                      For a successful import, ensure your CSV includes headings like: <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300">First Name</code>, <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300">Email</code>, <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300">Position</code>, and <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300">Skills</code>. Capitalization and ordering do not matter.
                    </p>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
};

export default AdminUpload;
