import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Sparkles, Award, CheckCircle2, AlertCircle, Printer, 
  Plus, Trash2, Mail, Phone, Globe, Briefcase, GraduationCap, ChevronRight, 
  RefreshCw, UploadCloud, ArrowLeft, FileSpreadsheet, Check
} from 'lucide-react';
import { jobRoles } from '../config/jobData';

const CandidatePortal = () => {
  const [selectedJobId, setSelectedJobId] = useState('frontend');
  const [selectedOption, setSelectedOption] = useState(null); // null, 'new', 'analyze'
  const [activeTab, setActiveTab] = useState('personal');
  const [parsingFile, setParsingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Resume builder form state
  const [resume, setResume] = useState({
    firstName: 'Vaishali',
    lastName: 'Vijayakumar',
    email: 'vaishali.vijayakumar@example.com',
    phone: '+1 (555) 432-8765',
    linkedin: 'linkedin.com/in/vaishalivijayakumar',
    summary: 'Experienced software engineer focused on building highly responsive, scalable web applications. Expert in clean code patterns, frontend architectures, and optimizing workflow performance.',
    skills: 'React, JavaScript, HTML, CSS, Git, TailwindCSS',
    experiences: [
      { id: 'exp1', title: 'Software Engineer', company: 'Innovation Hub', duration: '2024 - Present', desc: 'Led development of client dashboard features. Enhanced user experience metrics by 30% and introduced component libraries.' }
    ],
    educations: [
      { id: 'edu1', degree: 'B.S. Computer Science & Engineering', school: 'Tech University', year: '2023' }
    ],
    projects: [
      { id: 'proj1', title: 'HireSight Recruiter Suite', desc: 'Created a dual-engine candidate ingestion and resume optimization platform.', tech: 'React, Tailwind, Node.js' }
    ]
  });

  // Recommendation panel states
  const [atsScore, setAtsScore] = useState(0);
  const [matchedKeywords, setMatchedKeywords] = useState([]);
  const [missingKeywords, setMissingKeywords] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [generatingAi, setGeneratingAi] = useState(false);

  const selectedJob = jobRoles.find(j => j.id === selectedJobId) || jobRoles[0];

  // Helper to trigger simulated AI summary suggestion
  const handleGenerateAiSummary = () => {
    setGeneratingAi(true);
    setTimeout(() => {
      let generatedSummary = '';
      const candidateSkills = resume.skills.split(',').map(s => s.trim()).slice(0, 4).join(', ');
      
      if (selectedJob.id === 'frontend') {
        generatedSummary = `Detail-oriented Frontend Developer with extensive experience building interfaces. Skilled in modern JavaScript frameworks, design systems, and deploying responsive layouts with ${candidateSkills || 'React and CSS'}.`;
      } else if (selectedJob.id === 'backend') {
        generatedSummary = `Robust Backend Engineer focused on designing secure, scalable APIs and microservice architectures. Proficient in database indexing, server performance optimization, and utilizing ${candidateSkills || 'databases and system tools'}.`;
      } else if (selectedJob.id === 'fullstack') {
        generatedSummary = `Versatile Full Stack Developer with capabilities across client-side interfaces and database layers. Expert in building end-to-end applications and optimizing performance utilizing ${candidateSkills || 'React and Node.js'}.`;
      } else if (selectedJob.id === 'datascientist') {
        generatedSummary = `Analytical Data Scientist adept at translating unstructured data into strategic insights. Skilled in designing machine learning modeling pipelines and query structures using ${candidateSkills || 'Python and statistical packages'}.`;
      } else {
        generatedSummary = `Strategic Product Manager focused on aligning user research with roadmap priorities. Experienced in driving technical execution, writing specifications, and coordinating development.`;
      }

      setResume(prev => ({ ...prev, summary: generatedSummary }));
      setGeneratingAi(false);
      setActiveTab('personal');
    }, 1000);
  };

  // Perform ATS Score Audit in real-time
  useEffect(() => {
    const experiencesText = resume.experiences.map(e => `${e.title} ${e.company} ${e.desc}`).join(' ');
    const projectsText = resume.projects.map(p => `${p.title} ${p.desc} ${p.tech}`).join(' ');
    const resumeFullText = `${resume.summary} ${resume.skills} ${experiencesText} ${projectsText}`.toLowerCase();

    const matches = [];
    const missings = [];

    selectedJob.keywords.forEach(kw => {
      if (resumeFullText.includes(kw.toLowerCase())) {
        matches.push(kw);
      } else {
        missings.push(kw);
      }
    });

    setMatchedKeywords(matches);
    setMissingKeywords(missings);

    // Calculate dynamic ATS Score (0-100)
    let score = 0;

    if (resume.firstName && resume.lastName) score += 5;
    if (resume.email && resume.phone) score += 5;
    if (resume.summary && resume.summary.length > 50) score += 10;

    const matchRatio = selectedJob.keywords.length > 0 ? (matches.length / selectedJob.keywords.length) : 0;
    score += Math.round(matchRatio * 40);

    const skillsCount = resume.skills.split(',').filter(s => s.trim().length > 0).length;
    score += Math.min(20, skillsCount * 3.5);

    if (resume.experiences.length > 0) score += 10;
    if (resume.projects.length > 0) score += 10;

    setAtsScore(Math.min(100, Math.max(0, score)));

    // Suggestions
    const currentSuggestions = [];
    if (resume.summary.length < 100) {
      currentSuggestions.push({
        id: 's_sum',
        type: 'warning',
        text: 'Summary is brief. Add 2 more sentences detailing your leadership and technical strengths.'
      });
    }
    if (missings.length > 3) {
      currentSuggestions.push({
        id: 's_kw',
        type: 'important',
        text: `Consider adding these keywords to align with ${selectedJob.title}: ${missings.slice(0, 3).join(', ')}.`
      });
    }
    const hasNumbers = /[0-9]+%|[0-9]+\s*x|[0-9]+\s*million/i.test(experiencesText);
    if (!hasNumbers && resume.experiences.length > 0) {
      currentSuggestions.push({
        id: 's_metrics',
        type: 'tip',
        text: 'Include quantifiable impact metrics (e.g. "improved conversions by 15%") in your job roles.'
      });
    }
    if (skillsCount < 6) {
      currentSuggestions.push({
        id: 's_skills',
        type: 'tip',
        text: 'List at least 6 specialized skills to satisfy initial screen filters.'
      });
    }
    setSuggestions(currentSuggestions);
  }, [resume, selectedJobId, selectedJob]);

  // Form Field changes
  const handleFieldChange = (e) => {
    setResume(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Experience array actions
  const addExperience = () => {
    setResume(prev => ({
      ...prev,
      experiences: [...prev.experiences, { id: `exp_${Date.now()}`, title: '', company: '', duration: '', desc: '' }]
    }));
  };

  const updateExperience = (id, field, value) => {
    setResume(prev => ({
      ...prev,
      experiences: prev.experiences.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  const removeExperience = (id) => {
    setResume(prev => ({
      ...prev,
      experiences: prev.experiences.filter(e => e.id !== id)
    }));
  };

  // Education array actions
  const addEducation = () => {
    setResume(prev => ({
      ...prev,
      educations: [...prev.educations, { id: `edu_${Date.now()}`, degree: '', school: '', year: '' }]
    }));
  };

  const updateEducation = (id, field, value) => {
    setResume(prev => ({
      ...prev,
      educations: prev.educations.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  const removeEducation = (id) => {
    setResume(prev => ({
      ...prev,
      educations: prev.educations.filter(e => e.id !== id)
    }));
  };

  // Projects array actions
  const addProject = () => {
    setResume(prev => ({
      ...prev,
      projects: [...prev.projects, { id: `proj_${Date.now()}`, title: '', desc: '', tech: '' }]
    }));
  };

  const updateProject = (id, field, value) => {
    setResume(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const removeProject = (id) => {
    setResume(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id)
    }));
  };

  // Select option workflow
  const handleSelectNew = () => {
    // Start clean but with default name "Vaishali Vijayakumar"
    setResume({
      firstName: 'Vaishali',
      lastName: 'Vijayakumar',
      email: '',
      phone: '',
      linkedin: '',
      summary: '',
      skills: '',
      experiences: [],
      educations: [],
      projects: []
    });
    setUploadedFileName('');
    setSelectedOption('new');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setParsingFile(true);
      setUploadedFileName(file.name);
      
      // Simulate file content reading & parsing
      setTimeout(() => {
        // Feed mock parsed data or text contents matching selected job keywords
        const targetKeywords = selectedJob.keywords.slice(0, 5).join(', ');
        
        setResume({
          firstName: 'Vaishali',
          lastName: 'Vijayakumar',
          email: 'vaishali.vijayakumar@example.com',
          phone: '+1 (555) 432-8765',
          linkedin: 'linkedin.com/in/vaishalivijayakumar',
          summary: `Professional software developer with experienced backgrounds. Passionate about engineering high-quality workflows, collaborating on key features, and writing maintainable structures. Skilled in applying ${targetKeywords}.`,
          skills: `${targetKeywords}, Git, Development, databases`,
          experiences: [
            { id: 'exp_u1', title: 'Developer', company: 'Prior Tech Enterprise', duration: '2023 - 2025', desc: `Contributed to key code repositories. Participated in team standups and integrated features containing ${targetKeywords.split(', ')[0] || 'code'}.` }
          ],
          educations: [
            { id: 'edu_u1', degree: 'Bachelor of Science', school: 'State University', year: '2023' }
          ],
          projects: [
            { id: 'proj_u1', title: 'Document Audit App', desc: 'Created an audit software testing platform.', tech: 'HTML, CSS, JS' }
          ]
        });
        setParsingFile(false);
        setSelectedOption('analyze');
      }, 1500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pt-24 pb-20 px-6 bg-slate-50 min-h-screen flex flex-col print:bg-white print:pt-0 print:pb-0 text-slate-800 font-sans">
      
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
            box-shadow: none;
            border: none;
          }
          nav, footer, .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col print:max-w-full">
        
        {/* OPTION SELECTION SCREEN */}
        {selectedOption === null && (
          <div className="flex-1 flex flex-col justify-center items-center py-10 no-print">
            
            {/* Header */}
            <div className="text-center mb-12 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4">
                <Sparkles size={12} />
                <span>Choose Entry Method</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-outfit mb-3">
                ATS Optimizer Workspace
              </h1>
              <p className="text-slate-500 text-sm">
                Target job role: <span className="font-bold text-slate-800">{selectedJob.title}</span>. Choose whether you want to build a resume from scratch or import your existing resume file for instant feedback.
              </p>

              {/* Target job switcher */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold">
                <span className="text-slate-400">Targeting another position?</span>
                <select 
                  value={selectedJobId} 
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 outline-none font-bold cursor-pointer"
                >
                  {jobRoles.map(job => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Split Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
              
              {/* Option A: Build New */}
              <motion.div 
                whileHover={{ y: -4 }}
                className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={handleSelectNew}
              >
                <div>
                  <div className="w-12 h-12 bg-pink-50 border border-pink-100 rounded-xl flex items-center justify-center text-pink-600 mb-6">
                    <Plus size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 font-outfit mb-2">Build New Resume</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">
                    Create a clean, standardized resume structure step-by-step. Enter your contact details, education, and experience, while auditing keywords in real-time.
                  </p>
                </div>
                
                <button className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1">
                  <span>Start Building Scratch</span>
                  <ChevronRight size={14} />
                </button>
              </motion.div>

              {/* Option B: Upload Existing */}
              <motion.div 
                whileHover={{ y: -4 }}
                className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden"
              >
                {parsingFile && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6">
                    <LoaderRing />
                    <h4 className="font-bold text-slate-900 text-sm mt-4 font-outfit">Analyzing & Parsing Resume...</h4>
                    <p className="text-xs text-slate-400 mt-1">Extracting contact info, skills, and experience items.</p>
                  </div>
                )}

                <div>
                  <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                    <UploadCloud size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 font-outfit mb-2">Upload & Audit Resume</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">
                    Upload your current resume (PDF, DOCX, TXT) to get an alignment score against the requirements for <span className="font-bold text-slate-700">{selectedJob.title}</span>.
                  </p>
                  
                  {/* File Upload Zone */}
                  <div className="border border-dashed border-slate-200 rounded-xl p-6 bg-slate-50 text-center hover:bg-slate-100/50 transition-colors relative cursor-pointer">
                    <input 
                      type="file" 
                      id="opt-file-upload" 
                      accept=".pdf,.docx,.txt" 
                      onChange={handleFileUpload} 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                    <p className="text-xs font-bold text-slate-800">Drop your resume here or click</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, DOCX, or TXT formats</p>
                  </div>
                </div>
                
                <div className="mt-6 text-center text-[10px] text-slate-400 font-semibold">
                  Parsed data can be refined in the builder.
                </div>
              </motion.div>

            </div>

          </div>
        )}

        {/* WORKSPACE VIEW (Active once choice is made) */}
        {selectedOption !== null && (
          <>
            {/* Header Toolbar */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print border-b border-slate-200 pb-5">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedOption(null)}
                  className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors text-slate-500"
                  title="Back to Options"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <div className="flex items-center gap-1.5 text-pink-600 text-xs font-bold uppercase tracking-wider">
                    <Sparkles size={12} />
                    <span>Workspace: {selectedOption === 'new' ? 'New Resume Scratch' : 'Resume Audit Mode'}</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight font-outfit">
                    {resume.firstName} {resume.lastName}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-semibold shadow-sm">
                  <Briefcase size={14} className="text-slate-400" />
                  <span>Target Role:</span>
                  <select 
                    value={selectedJobId} 
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="bg-transparent border-none outline-none font-bold text-slate-900 cursor-pointer"
                  >
                    {jobRoles.map(job => (
                      <option key={job.id} value={job.id}>{job.title}</option>
                    ))}
                  </select>
                </div>
                
                <button 
                  onClick={handlePrint}
                  className="btn bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-bold rounded-lg shadow-md shadow-indigo-600/10 flex items-center gap-1.5"
                >
                  <Printer size={15} />
                  <span>Download & Print PDF</span>
                </button>
              </div>
            </div>

            {/* Split Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start no-print mb-10">
              
              {/* Form Side */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                <div className="surface-card bg-white p-6 border border-slate-200/60 rounded-2xl shadow-sm">
                  
                  {/* Tabs */}
                  <div className="flex border-b border-slate-100 mb-6 overflow-x-auto text-xs font-bold text-slate-400">
                    <button 
                      onClick={() => setActiveTab('personal')}
                      className={`pb-3 px-4 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'personal' ? 'border-pink-600 text-pink-600 font-extrabold' : 'border-transparent hover:text-slate-900'}`}
                    >
                      Personal & Summary
                    </button>
                    <button 
                      onClick={() => setActiveTab('experience')}
                      className={`pb-3 px-4 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'experience' ? 'border-pink-600 text-pink-600 font-extrabold' : 'border-transparent hover:text-slate-900'}`}
                    >
                      Experience ({resume.experiences.length})
                    </button>
                    <button 
                      onClick={() => setActiveTab('education')}
                      className={`pb-3 px-4 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'education' ? 'border-pink-600 text-pink-600 font-extrabold' : 'border-transparent hover:text-slate-900'}`}
                    >
                      Education ({resume.educations.length})
                    </button>
                    <button 
                      onClick={() => setActiveTab('projects')}
                      className={`pb-3 px-4 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'projects' ? 'border-pink-600 text-pink-600 font-extrabold' : 'border-transparent hover:text-slate-900'}`}
                    >
                      Projects & Skills
                    </button>
                  </div>

                  {/* PERSONAL TAB */}
                  {activeTab === 'personal' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">First Name</label>
                          <input type="text" name="firstName" value={resume.firstName} onChange={handleFieldChange} className="input-field text-sm" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">Last Name</label>
                          <input type="text" name="lastName" value={resume.lastName} onChange={handleFieldChange} className="input-field text-sm" />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">Email Address</label>
                          <input type="email" name="email" value={resume.email} onChange={handleFieldChange} className="input-field text-sm" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">Phone</label>
                          <input type="text" name="phone" value={resume.phone} onChange={handleFieldChange} className="input-field text-sm" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">LinkedIn Profile</label>
                          <input type="text" name="linkedin" value={resume.linkedin} onChange={handleFieldChange} className="input-field text-sm" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-600">Professional Summary</label>
                          <button 
                            onClick={handleGenerateAiSummary}
                            disabled={generatingAi}
                            className="text-[10px] font-bold text-pink-600 hover:text-pink-500 bg-transparent border-none flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {generatingAi ? (
                              <><RefreshCw size={12} className="animate-spin" /> Auto-writing...</>
                            ) : (
                              <><Sparkles size={12} /> Suggest Summary with AI</>
                            )}
                          </button>
                        </div>
                        <textarea 
                          name="summary" 
                          rows={5} 
                          value={resume.summary} 
                          onChange={handleFieldChange} 
                          className="input-field text-sm"
                          placeholder="Summarize your professional experience, core domain strengths, and key achievements..."
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* EXPERIENCE TAB */}
                  {activeTab === 'experience' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Work Experience</h4>
                        <button 
                          onClick={addExperience}
                          className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline bg-transparent border-none cursor-pointer"
                        >
                          <Plus size={14} /> Add Role
                        </button>
                      </div>

                      <div className="space-y-4">
                        {resume.experiences.map((exp) => (
                          <div key={exp.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3 relative">
                            <button 
                              onClick={() => removeExperience(exp.id)}
                              className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-600">Job Title</label>
                                <input 
                                  type="text" 
                                  value={exp.title} 
                                  onChange={(e) => updateExperience(exp.id, 'title', e.target.value)} 
                                  placeholder="e.g. Software Engineer" 
                                  className="input-field py-1.5 text-xs bg-white" 
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-600">Company</label>
                                <input 
                                  type="text" 
                                  value={exp.company} 
                                  onChange={(e) => updateExperience(exp.id, 'company', e.target.value)} 
                                  placeholder="e.g. Acme Inc" 
                                  className="input-field py-1.5 text-xs bg-white" 
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-600">Duration</label>
                                <input 
                                  type="text" 
                                  value={exp.duration} 
                                  onChange={(e) => updateExperience(exp.id, 'duration', e.target.value)} 
                                  placeholder="e.g. Jan 2023 - Present" 
                                  className="input-field py-1.5 text-xs bg-white" 
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-600">Job Description</label>
                              <textarea 
                                rows={3} 
                                value={exp.desc} 
                                onChange={(e) => updateExperience(exp.id, 'desc', e.target.value)} 
                                placeholder="Detail accomplishments. Mention metrics if possible..." 
                                className="input-field py-1.5 text-xs bg-white" 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* EDUCATION TAB */}
                  {activeTab === 'education' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Education</h4>
                        <button 
                          onClick={addEducation}
                          className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline bg-transparent border-none cursor-pointer"
                        >
                          <Plus size={14} /> Add Degree
                        </button>
                      </div>

                      <div className="space-y-4">
                        {resume.educations.map((edu) => (
                          <div key={edu.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3 relative">
                            <button 
                              onClick={() => removeEducation(edu.id)}
                              className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-1 col-span-2">
                                <label className="text-[11px] font-bold text-slate-600">Degree & Major</label>
                                <input 
                                  type="text" 
                                  value={edu.degree} 
                                  onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)} 
                                  placeholder="e.g. B.S. Engineering" 
                                  className="input-field py-1.5 text-xs bg-white" 
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-600">Graduation Year</label>
                                <input 
                                  type="text" 
                                  value={edu.year} 
                                  onChange={(e) => updateEducation(edu.id, 'year', e.target.value)} 
                                  placeholder="e.g. 2023" 
                                  className="input-field py-1.5 text-xs bg-white" 
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-600">School / University</label>
                              <input 
                                type="text" 
                                value={edu.school} 
                                onChange={(e) => updateEducation(edu.id, 'school', e.target.value)} 
                                placeholder="e.g. University Name" 
                                className="input-field py-1.5 text-xs bg-white" 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* PROJECTS & SKILLS TAB */}
                  {activeTab === 'projects' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">Technical Skills (comma separated)</label>
                        <input 
                          type="text" 
                          name="skills" 
                          value={resume.skills} 
                          onChange={handleFieldChange} 
                          className="input-field text-sm"
                          placeholder="e.g. React, Node.js, SQL" 
                        />
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Projects</h4>
                        <button 
                          onClick={addProject}
                          className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline bg-transparent border-none cursor-pointer"
                        >
                          <Plus size={14} /> Add Project
                        </button>
                      </div>

                      <div className="space-y-4">
                        {resume.projects.map((proj) => (
                          <div key={proj.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3 relative">
                            <button 
                              onClick={() => removeProject(proj.id)}
                              className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-600">Project Name</label>
                                <input 
                                  type="text" 
                                  value={proj.title} 
                                  onChange={(e) => updateProject(proj.id, 'title', e.target.value)} 
                                  placeholder="e.g. Portfolio Builder" 
                                  className="input-field py-1.5 text-xs bg-white" 
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-600">Tech Stack</label>
                                <input 
                                  type="text" 
                                  value={proj.tech} 
                                  onChange={(e) => updateProject(proj.id, 'tech', e.target.value)} 
                                  placeholder="e.g. React, Python" 
                                  className="input-field py-1.5 text-xs bg-white" 
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-600">Project Description</label>
                              <textarea 
                                rows={3} 
                                value={proj.desc} 
                                onChange={(e) => updateProject(proj.id, 'desc', e.target.value)} 
                                placeholder="Describe project outputs and features..." 
                                className="input-field py-1.5 text-xs bg-white" 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                </div>

              </div>

              {/* Auditor Side */}
              <div className="lg:col-span-5 flex flex-col gap-6 sticky top-24">
                
                {/* LIGHT THEMED ATS score dial */}
                <div className="surface-card bg-white border border-slate-200 p-6 relative overflow-hidden rounded-2xl shadow-sm">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl"></div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 font-outfit">ATS Compatibility Score</h3>
                  
                  <div className="flex items-center gap-6">
                    <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                      <svg className="absolute w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="rgba(0,0,0,0.05)" strokeWidth="8" fill="transparent" />
                        <circle cx="48" cy="48" r="40" stroke="#ec4899" strokeWidth="8" fill="transparent" 
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 - (251.2 * atsScore) / 100}
                          className="transition-all duration-500"
                        />
                      </svg>
                      <span className="text-2xl font-black font-outfit text-slate-900">{atsScore}%</span>
                    </div>
                    
                    <div>
                      <h4 className="font-extrabold text-base text-slate-800">{atsScore >= 75 ? 'Excellent Alignment' : atsScore >= 50 ? 'Strong Baseline' : 'Requires Optimization'}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        This auditing score updates dynamically as you enrich your skills inventory and experience descriptions.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Keywords Audit check list */}
                <div className="surface-card bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 font-outfit">Target Keywords Match</h3>
                  <p className="text-[11px] text-slate-500 mb-4">Required skills for <span className="font-bold text-slate-800">{selectedJob.title}</span>. Match checks are real-time.</p>
                  
                  <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto pr-1">
                    {selectedJob.keywords.map(kw => {
                      const matched = matchedKeywords.includes(kw);
                      return (
                        <span 
                          key={kw} 
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border transition-colors ${
                            matched 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${matched ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                          {kw}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Suggestions tips */}
                <div className="surface-card bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex-1">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 font-outfit">Optimization Feedback</h3>
                  
                  {suggestions.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-xs">
                      <Check className="mx-auto mb-2 text-emerald-500" size={24} />
                      Your resume matches the core requirements perfectly!
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                      {suggestions.map((s) => (
                        <div key={s.id} className={`p-3 rounded-lg border text-xs leading-relaxed flex items-start gap-2 ${
                          s.type === 'important' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                          s.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                          'bg-indigo-50 border-indigo-100 text-indigo-700'
                        }`}>
                          <AlertCircle size={14} className="shrink-0 mt-0.5" />
                          <div>{s.text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* A4 Sheet Print preview */}
            <div className="mt-4 border-t border-slate-200 pt-8 no-print">
              <h3 className="text-base font-bold text-slate-800 mb-4 font-outfit text-center">Resume Preview Layout</h3>
            </div>

            <div 
              id="print-area"
              className="mx-auto w-full max-w-[800px] bg-white border border-slate-200 shadow-xl p-12 text-slate-800 font-serif min-h-[1050px] mb-20 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="border-b-2 border-slate-800 pb-5">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight font-sans text-center mb-2">
                  {resume.firstName} {resume.lastName}
                </h1>
                
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-1.5 text-xs font-sans text-slate-600 font-semibold">
                  {resume.email && <span className="flex items-center gap-1"><Mail size={12} /> {resume.email}</span>}
                  {resume.phone && <span className="flex items-center gap-1"><Phone size={12} /> {resume.phone}</span>}
                  {resume.linkedin && <span className="flex items-center gap-1"><Globe size={12} /> {resume.linkedin}</span>}
                </div>
              </div>

              {/* Summary */}
              {resume.summary && (
                <div className="py-4">
                  <h3 className="text-sm font-black text-slate-900 font-sans uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Professional Summary</h3>
                  <p className="text-xs leading-relaxed text-slate-700 font-serif">
                    {resume.summary}
                  </p>
                </div>
              )}

              {/* Skills */}
              {resume.skills && (
                <div className="py-2">
                  <h3 className="text-sm font-black text-slate-900 font-sans uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Technical Skills</h3>
                  <p className="text-xs leading-relaxed text-slate-700 font-serif">
                    {resume.skills.split(',').map(s => s.trim()).join('  •  ')}
                  </p>
                </div>
              )}

              {/* Experiences */}
              {resume.experiences.length > 0 && (
                <div className="py-4 flex-1">
                  <h3 className="text-sm font-black text-slate-900 font-sans uppercase tracking-widest border-b border-slate-200 pb-1 mb-3">Professional Experience</h3>
                  
                  <div className="space-y-4">
                    {resume.experiences.map((exp, idx) => (
                      <div key={exp.id || idx}>
                        <div className="flex justify-between items-start text-xs font-semibold mb-1">
                          <span className="font-bold text-slate-900 font-sans">{exp.title || 'Job Role'}</span>
                          <span className="text-slate-500 font-sans font-medium">{exp.duration || 'Timeline'}</span>
                        </div>
                        <div className="text-[11px] font-sans font-semibold text-indigo-700 mb-1.5">{exp.company || 'Enterprise'}</div>
                        <p className="text-xs text-slate-600 leading-relaxed font-serif">
                          {exp.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {resume.projects.length > 0 && (
                <div className="py-4">
                  <h3 className="text-sm font-black text-slate-900 font-sans uppercase tracking-widest border-b border-slate-200 pb-1 mb-3">Projects</h3>
                  
                  <div className="space-y-3">
                    {resume.projects.map((proj, idx) => (
                      <div key={proj.id || idx} className="text-xs">
                        <div className="flex justify-between items-center font-bold text-slate-900 font-sans mb-0.5">
                          <span>{proj.title}</span>
                          {proj.tech && <span className="text-[10px] text-indigo-600 font-medium font-sans">[{proj.tech}]</span>}
                        </div>
                        <p className="text-slate-600 leading-relaxed font-serif text-[11px]">
                          {proj.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {resume.educations.length > 0 && (
                <div className="py-4 border-t border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 font-sans uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Education</h3>
                  
                  <div className="space-y-2">
                    {resume.educations.map((edu, idx) => (
                      <div key={edu.id || idx} className="flex justify-between items-start text-xs">
                        <div>
                          <span className="font-bold text-slate-900 font-sans">{edu.degree}</span>
                          <span className="text-slate-500 font-sans">, {edu.school}</span>
                        </div>
                        <span className="text-slate-500 font-sans font-medium">{edu.year}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </>
        )}

      </div>
    </div>
  );
};

// Simulated Loading Indicator
const LoaderRing = () => (
  <div className="relative w-10 h-10 flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-indigo-100 rounded-full absolute"></div>
    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute"></div>
  </div>
);

export default CandidatePortal;
