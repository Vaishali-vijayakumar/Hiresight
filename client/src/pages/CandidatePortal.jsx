import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Sparkles, Award, CheckCircle2, AlertCircle, Printer, 
  Plus, Trash2, Mail, Phone, Globe, Briefcase, GraduationCap, ChevronRight, RefreshCw 
} from 'lucide-react';
import { jobRoles } from '../config/jobData';

const CandidatePortal = () => {
  const [selectedJobId, setSelectedJobId] = useState('frontend');
  const [activeTab, setActiveTab] = useState('personal');

  // Resume builder form state
  const [resume, setResume] = useState({
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    phone: '+1 (555) 019-2834',
    linkedin: 'linkedin.com/in/janedoe',
    summary: 'Detail-oriented engineer with experience building web applications. Passionate about user-friendly design, clean code, and database optimizations.',
    skills: 'React, JavaScript, HTML, CSS, Git, TailwindCSS',
    experiences: [
      { id: 'exp1', title: 'Software Engineer I', company: 'TechCorp Solutions', duration: '2024 - Present', desc: 'Maintained and developed critical user interfaces for the core SaaS dashboard. Collaborated with designers to build components.' }
    ],
    educations: [
      { id: 'edu1', degree: 'B.S. Computer Science', school: 'State University', year: '2023' }
    ],
    projects: [
      { id: 'proj1', title: 'Talent Audit Engine', desc: 'Built a web tool that processes user resumes and audits keywords against job roles.', tech: 'React, Node.js, Express' }
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
        generatedSummary = `Highly motivated Frontend Developer with a strong foundation in modern Javascript architectures. Proficient in building responsive, high-performance user interfaces utilizing ${candidateSkills || 'React and modern web tools'}. Experienced in collaborating in agile teams to ship pixel-perfect features.`;
      } else if (selectedJob.id === 'backend') {
        generatedSummary = `Scalable systems-focused Backend Engineer with solid expertise in API designs and server-side logic. Skilled in database architecture (SQL/NoSQL) and modern workflows. Leverages tools like ${candidateSkills || 'Node.js and Docker'} to deliver robust and highly available microservices.`;
      } else if (selectedJob.id === 'fullstack') {
        generatedSummary = `Dynamic Full Stack Engineer equipped with comprehensive knowledge in both frontend and backend development. Adept at building end-to-end applications, designing database schemas, and writing responsive UI layouts using ${candidateSkills || 'React, Express, and databases'}.`;
      } else if (selectedJob.id === 'datascientist') {
        generatedSummary = `Data Scientist with a background in writing statistical modeling pipelines and machine learning algorithms. Proficient in SQL query execution and extracting visual insights from raw datasets. Leverages ${candidateSkills || 'Python and analytical tools'} to solve business problems.`;
      } else {
        generatedSummary = `Strategic Product Manager skilled in leading cross-functional agile teams and translating customer needs into roadmap priorities. Adept at data analysis, writing detailed user stories, and steering execution for complex web applications.`;
      }

      setResume({ ...resume, summary: generatedSummary });
      setGeneratingAi(false);
      setActiveTab('personal'); // focus back
    }, 1200);
  };

  // Perform ATS Score Audit and Keyword Extraction in real-time
  useEffect(() => {
    // Compile all text contents of the resume builder
    const experiencesText = resume.experiences.map(e => `${e.title} ${e.company} ${e.desc}`).join(' ');
    const projectsText = resume.projects.map(p => `${p.title} ${p.desc} ${p.tech}`).join(' ');
    const resumeFullText = `${resume.summary} ${resume.skills} ${experiencesText} ${projectsText}`.toLowerCase();

    // Check against job keywords
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

    // 1. Personal details & profile health (up to 20 pts)
    if (resume.firstName && resume.lastName) score += 5;
    if (resume.email && resume.phone) score += 5;
    if (resume.summary && resume.summary.length > 50) score += 10;

    // 2. Keyword Match (up to 40 pts)
    const matchRatio = selectedJob.keywords.length > 0 ? (matches.length / selectedJob.keywords.length) : 0;
    score += Math.round(matchRatio * 40);

    // 3. Skills Listing count (up to 20 pts)
    const skillsCount = resume.skills.split(',').filter(s => s.trim().length > 0).length;
    score += Math.min(20, skillsCount * 3.5);

    // 4. Experience & Projects detailed (up to 20 pts)
    if (resume.experiences.length > 0) score += 10;
    if (resume.projects.length > 0) score += 10;

    // Cap at 100
    const finalScore = Math.min(100, Math.max(0, score));
    setAtsScore(finalScore);

    // Dynamic suggestions generation
    const currentSuggestions = [];
    
    if (resume.summary.length < 100) {
      currentSuggestions.push({
        id: 's_sum',
        type: 'warning',
        text: 'Professional summary is too concise. Aim for 3-4 sentences detailing your core impact.'
      });
    }

    if (missings.length > 3) {
      currentSuggestions.push({
        id: 's_kw',
        type: 'important',
        text: `Add target keywords to boost index: ${missings.slice(0, 4).join(', ')}.`
      });
    }

    // Check for metrics/numbers in experiences description (e.g. %, $, 5x, 20)
    const hasNumbers = /[0-9]+%|[0-9]+\s*x|[0-9]+\s*million|[0-9]+\s*percent/i.test(experiencesText);
    if (!hasNumbers && resume.experiences.length > 0) {
      currentSuggestions.push({
        id: 's_metrics',
        type: 'tip',
        text: 'Quantify your contributions under work experience (e.g., "improved loading speed by 35%").'
      });
    }

    if (skillsCount < 6) {
      currentSuggestions.push({
        id: 's_skills',
        type: 'tip',
        text: 'List at least 6 technical/soft skills to pass initial screening filters.'
      });
    }

    setSuggestions(currentSuggestions);

  }, [resume, selectedJobId]);

  // Form Field change
  const handleFieldChange = (e) => {
    setResume({ ...resume, [e.target.name]: e.target.value });
  };

  // Experience array actions
  const addExperience = () => {
    setResume({
      ...resume,
      experiences: [
        ...resume.experiences,
        { id: `exp_${Date.now()}`, title: '', company: '', duration: '', desc: '' }
      ]
    });
  };

  const updateExperience = (id, field, value) => {
    setResume({
      ...resume,
      experiences: resume.experiences.map(e => e.id === id ? { ...e, [field]: value } : e)
    });
  };

  const removeExperience = (id) => {
    setResume({
      ...resume,
      experiences: resume.experiences.filter(e => e.id !== id)
    });
  };

  // Education array actions
  const addEducation = () => {
    setResume({
      ...resume,
      educations: [
        ...resume.educations,
        { id: `edu_${Date.now()}`, degree: '', school: '', year: '' }
      ]
    });
  };

  const updateEducation = (id, field, value) => {
    setResume({
      ...resume,
      educations: resume.educations.map(e => e.id === id ? { ...e, [field]: value } : e)
    });
  };

  const removeEducation = (id) => {
    setResume({
      ...resume,
      educations: resume.educations.filter(e => e.id !== id)
    });
  };

  // Projects array actions
  const addProject = () => {
    setResume({
      ...resume,
      projects: [
        ...resume.projects,
        { id: `proj_${Date.now()}`, title: '', desc: '', tech: '' }
      ]
    });
  };

  const updateProject = (id, field, value) => {
    setResume({
      ...resume,
      projects: resume.projects.map(p => p.id === id ? { ...p, [field]: value } : p)
    });
  };

  const removeProject = (id) => {
    setResume({
      ...resume,
      projects: resume.projects.filter(p => p.id !== id)
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pt-24 pb-20 px-6 bg-slate-50 min-h-screen flex flex-col print:bg-white print:pt-0 print:pb-0">
      
      {/* Styles for clean PDF printing */}
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
        
        {/* Page Header (No print) */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
          <div>
            <div className="flex items-center gap-2 text-pink-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles size={14} />
              <span>ATS optimization workshop</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight font-outfit">Resume Builder & Suggestion Engine</h1>
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
              className="btn btn-primary bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/10 flex items-center gap-2"
            >
              <Printer size={16} />
              <span>Download & Print</span>
            </button>
          </div>
        </div>

        {/* Dashboard Split (No print) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start no-print mb-10">
          
          {/* Builder Form tabs */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            <div className="surface-card bg-white p-6">
              {/* Form Navigation Tabs */}
              <div className="flex border-b border-slate-100 mb-6 overflow-x-auto text-xs font-bold text-slate-500">
                <button 
                  onClick={() => setActiveTab('personal')}
                  className={`pb-3 px-4 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'personal' ? 'border-pink-600 text-pink-600' : 'border-transparent hover:text-slate-900'}`}
                >
                  Personal & Summary
                </button>
                <button 
                  onClick={() => setActiveTab('experience')}
                  className={`pb-3 px-4 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'experience' ? 'border-pink-600 text-pink-600' : 'border-transparent hover:text-slate-900'}`}
                >
                  Experience ({resume.experiences.length})
                </button>
                <button 
                  onClick={() => setActiveTab('education')}
                  className={`pb-3 px-4 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'education' ? 'border-pink-600 text-pink-600' : 'border-transparent hover:text-slate-900'}`}
                >
                  Education ({resume.educations.length})
                </button>
                <button 
                  onClick={() => setActiveTab('projects')}
                  className={`pb-3 px-4 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'projects' ? 'border-pink-600 text-pink-600' : 'border-transparent hover:text-slate-900'}`}
                >
                  Projects & Skills
                </button>
              </div>

              {/* TAB 1: PERSONAL & SUMMARY */}
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
                          <><RefreshCw size={12} className="animate-spin" /> Suggesting Summary...</>
                        ) : (
                          <><Sparkles size={12} /> Auto-Suggest Summary</>
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

              {/* TAB 2: EXPERIENCE */}
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
                    {resume.experiences.map((exp, idx) => (
                      <div key={exp.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3 relative group">
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
                              placeholder="e.g. Senior Frontend Developer" 
                              className="input-field py-1.5 text-xs bg-white" 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600">Company Name</label>
                            <input 
                              type="text" 
                              value={exp.company} 
                              onChange={(e) => updateExperience(exp.id, 'company', e.target.value)} 
                              placeholder="e.g. Acme Corp" 
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
                              placeholder="e.g. Jun 2022 - Present" 
                              className="input-field py-1.5 text-xs bg-white" 
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600">Description & Accomplishments</label>
                          <textarea 
                            rows={3} 
                            value={exp.desc} 
                            onChange={(e) => updateExperience(exp.id, 'desc', e.target.value)} 
                            placeholder="Detail key responsibilities. Tip: Quantify with metrics like 'accelerated performance by 20%'..." 
                            className="input-field py-1.5 text-xs bg-white" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* TAB 3: EDUCATION */}
              {activeTab === 'education' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Education Details</h4>
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
                              placeholder="e.g. B.S. Computer Science" 
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
                            placeholder="e.g. MIT" 
                            className="input-field py-1.5 text-xs bg-white" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* TAB 4: PROJECTS & SKILLS */}
              {activeTab === 'projects' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Core Technical Skills (comma separated)</label>
                    <input 
                      type="text" 
                      name="skills" 
                      value={resume.skills} 
                      onChange={handleFieldChange} 
                      className="input-field text-sm"
                      placeholder="e.g. React, JavaScript, Node.js, SQL" 
                    />
                    <p className="text-[10px] text-slate-400">Separating skills with commas allows the matching engine to process them correctly.</p>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Key Projects</h4>
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
                            <label className="text-[11px] font-bold text-slate-600">Project Title</label>
                            <input 
                              type="text" 
                              value={proj.title} 
                              onChange={(e) => updateProject(proj.id, 'title', e.target.value)} 
                              placeholder="e.g. E-Commerce Platform" 
                              className="input-field py-1.5 text-xs bg-white" 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600">Technologies Used</label>
                            <input 
                              type="text" 
                              value={proj.tech} 
                              onChange={(e) => updateProject(proj.id, 'tech', e.target.value)} 
                              placeholder="e.g. React, Redux, Node" 
                              className="input-field py-1.5 text-xs bg-white" 
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600">Project Description</label>
                          <textarea 
                            rows={3.5} 
                            value={proj.desc} 
                            onChange={(e) => updateProject(proj.id, 'desc', e.target.value)} 
                            placeholder="Detail what problem was solved and how..." 
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

          {/* ATS Auditor Right Panel */}
          <div className="lg:col-span-5 flex flex-col gap-6 sticky top-24">
            
            {/* ATS Match Score */}
            <div className="surface-card bg-slate-900 text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl"></div>
              <h3 className="text-sm font-bold font-outfit text-slate-400 uppercase tracking-widest mb-4">ATS Match Score</h3>
              
              <div className="flex items-center gap-6">
                {/* Circular Score display */}
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                    <circle cx="48" cy="48" r="40" stroke="#ec4899" strokeWidth="8" fill="transparent" 
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * atsScore) / 100}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <span className="text-2xl font-black font-outfit text-white">{atsScore}%</span>
                </div>
                
                <div>
                  <h4 className="font-bold text-base text-white">{atsScore >= 80 ? 'Excellent Match' : atsScore >= 55 ? 'Good Alignment' : 'Needs Optimization'}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    This score is calculated by auditing contact metadata, core experience density, listed skills, and matching keywords against the target role requirement.
                  </p>
                </div>
              </div>
            </div>

            {/* Keyword Audit Checkbox list */}
            <div className="surface-card bg-white p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 font-outfit">Keyword Suitability Audit</h3>
              <p className="text-[11px] text-slate-500 mb-4">The following critical skills are required for <span className="font-bold text-slate-800">{selectedJob.title}</span>. Ensure they are mentioned in your resume.</p>
              
              <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-1">
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

            {/* Recommendations */}
            <div className="surface-card bg-white p-6 flex-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 font-outfit">Actionable Optimization Tips</h3>
              
              {suggestions.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">
                  <CheckCircle2 className="mx-auto mb-2 text-emerald-500" size={24} />
                  Your resume meets all general ATS filters! You're ready to submit.
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

        {/* Live Resume Sheet Preview - Page formatted representation */}
        <div className="mt-4 border-t border-slate-200 pt-8 no-print">
          <h3 className="text-base font-bold text-slate-800 mb-4 font-outfit text-center">Standard A4 Resume Layout Preview</h3>
        </div>

        {/* Page Sheet Container */}
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

          {/* Professional Summary */}
          {resume.summary && (
            <div className="py-4">
              <h3 className="text-sm font-black text-slate-900 font-sans uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Professional Summary</h3>
              <p className="text-xs leading-relaxed text-slate-700 font-serif">
                {resume.summary}
              </p>
            </div>
          )}

          {/* Core Technical Skills */}
          {resume.skills && (
            <div className="py-2">
              <h3 className="text-sm font-black text-slate-900 font-sans uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Skills Inventory</h3>
              <p className="text-xs leading-relaxed text-slate-700 font-serif">
                {resume.skills.split(',').map(s => s.trim()).join('  •  ')}
              </p>
            </div>
          )}

          {/* Work History */}
          {resume.experiences.length > 0 && (
            <div className="py-4 flex-1">
              <h3 className="text-sm font-black text-slate-900 font-sans uppercase tracking-widest border-b border-slate-200 pb-1 mb-3">Professional Experience</h3>
              
              <div className="space-y-4">
                {resume.experiences.map((exp, idx) => (
                  <div key={exp.id || idx}>
                    <div className="flex justify-between items-start text-xs font-semibold mb-1">
                      <span className="font-bold text-slate-900 font-sans">{exp.title || 'Job Title'}</span>
                      <span className="text-slate-500 font-sans font-medium">{exp.duration || 'Duration'}</span>
                    </div>
                    <div className="text-[11px] font-sans font-semibold text-indigo-700 mb-1.5">{exp.company || 'Company Name'}</div>
                    <p className="text-xs text-slate-600 leading-relaxed font-serif">
                      {exp.desc || 'Accomplishments...'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {resume.projects.length > 0 && (
            <div className="py-4">
              <h3 className="text-sm font-black text-slate-900 font-sans uppercase tracking-widest border-b border-slate-200 pb-1 mb-3">Key Projects</h3>
              
              <div className="space-y-3">
                {resume.projects.map((proj, idx) => (
                  <div key={proj.id || idx} className="text-xs">
                    <div className="flex justify-between items-center font-bold text-slate-900 font-sans mb-0.5">
                      <span>{proj.title || 'Project Name'}</span>
                      {proj.tech && <span className="text-[10px] text-indigo-600 font-medium font-sans">[{proj.tech}]</span>}
                    </div>
                    <p className="text-slate-600 leading-relaxed font-serif text-[11px]">
                      {proj.desc || 'Project details...'}
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
                      <span className="font-bold text-slate-900 font-sans">{edu.degree || 'Degree'}</span>
                      <span className="text-slate-500 font-sans">, {edu.school || 'School'}</span>
                    </div>
                    <span className="text-slate-500 font-sans font-medium">{edu.year || 'Year'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default CandidatePortal;
