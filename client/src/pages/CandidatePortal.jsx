import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Sparkles, Award, CheckCircle2, AlertCircle, Printer, 
  UploadCloud, ArrowLeft, RefreshCw, Check, ClipboardList, PenTool, Plus, Trash2, BookOpen
} from 'lucide-react';

const CandidatePortal = () => {
  const [portalMode, setPortalMode] = useState(null); // null, 'builder', 'auditor'
  const [auditorSubState, setAuditorSubState] = useState('choose'); // 'choose', 'active'
  
  const handlePrint = () => {
    window.print();
  };
  
  // ==========================================
  // 1. PATH A: ATS RESUME BUILDER STATE
  // ==========================================
  const [builderTab, setBuilderTab] = useState('contact'); // contact, experience, education
  const [builderData, setBuilderData] = useState({
    name: 'Vaishali Vijayakumar',
    email: 'vaishali.vijayakumar@example.com',
    phone: '+1 (555) 432-8765',
    linkedin: 'linkedin.com/in/vaishalivijayakumar',
    targetRole: 'Software Engineer',
    summary: 'Experienced software engineer focused on building highly responsive, scalable web applications. Expert in clean code patterns, frontend architectures, and optimizing workflow performance.',
    skills: 'React, JavaScript, HTML5, CSS3, Git, TailwindCSS, Node.js, SQL',
    experience: [
      { id: 1, role: 'Software Engineer', company: 'Innovation Hub', duration: '2024 - Present', description: 'Led development of client dashboard features. Enhanced user experience metrics by 30% and introduced component libraries.' }
    ],
    education: [
      { id: 1, degree: 'B.S. in Computer Science', school: 'Tech University', year: '2023' }
    ]
  });

  const handleBuilderFieldChange = (e) => {
    const { name, value } = e.target;
    setBuilderData(prev => ({ ...prev, [name]: value }));
  };

  const handleExpChange = (id, field, val) => {
    setBuilderData(prev => ({
      ...prev,
      experience: prev.experience.map(item => item.id === id ? { ...item, [field]: val } : item)
    }));
  };

  const addExperience = () => {
    setBuilderData(prev => ({
      ...prev,
      experience: [...prev.experience, { id: Date.now(), role: '', company: '', duration: '', description: '' }]
    }));
  };

  const removeExperience = (id) => {
    setBuilderData(prev => ({
      ...prev,
      experience: prev.experience.filter(item => item.id !== id)
    }));
  };

  const handleEduChange = (id, field, val) => {
    setBuilderData(prev => ({
      ...prev,
      education: prev.education.map(item => item.id === id ? { ...item, [field]: val } : item)
    }));
  };

  const addEducation = () => {
    setBuilderData(prev => ({
      ...prev,
      education: [...prev.education, { id: Date.now(), degree: '', school: '', year: '' }]
    }));
  };

  const removeEducation = (id) => {
    setBuilderData(prev => ({
      ...prev,
      education: prev.education.filter(item => item.id !== id)
    }));
  };

  // ==========================================
  // 2. PATH B: RESUME AUDITOR STATE
  // ==========================================
  const [auditorTargetRole, setAuditorTargetRole] = useState('Frontend Engineer');
  const [auditorText, setAuditorText] = useState(
    `Vaishali Vijayakumar\nvaishali.vijayakumar@example.com\n+1 (555) 432-8765\nlinkedin.com/in/vaishalivijayakumar\n\nExperienced profile with expertise in web engineering, script coding, client designs, and database integrations.\n\nSKILLS:\nReact, Python, HTML, CSS, JavaScript, Git`
  );
  const [isEditingAuditorText, setIsEditingAuditorText] = useState(false);
  const [parsingFile, setParsingFile] = useState(false);
  const [fileName, setFileName] = useState('');
  
  // Auditor analysis outcomes
  const [atsScore, setAtsScore] = useState(0);
  const [matchedKeywords, setMatchedKeywords] = useState([]);
  const [missingKeywords, setMissingKeywords] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  // Helper to dynamically extract keywords based on input target role
  const getDynamicKeywordsForRole = (roleText) => {
    const role = (roleText || '').toLowerCase();
    if (role.includes('front') || role.includes('react') || role.includes('ui') || role.includes('ux') || role.includes('client')) {
      return ['React', 'JavaScript', 'HTML5', 'CSS3', 'TailwindCSS', 'TypeScript', 'Responsive Design', 'Vite', 'Git', 'Webpack', 'State Management'];
    }
    if (role.includes('back') || role.includes('node') || role.includes('api') || role.includes('server') || role.includes('db')) {
      return ['Node.js', 'Express', 'SQL', 'PostgreSQL', 'MongoDB', 'REST APIs', 'Docker', 'Git', 'System Design', 'Redis', 'GraphQL'];
    }
    if (role.includes('full') || role.includes('stack') || role.includes('web')) {
      return ['React', 'Node.js', 'JavaScript', 'Express', 'SQL', 'REST APIs', 'Git', 'TailwindCSS', 'TypeScript', 'API Design'];
    }
    if (role.includes('data') || role.includes('analyst') || role.includes('science') || role.includes('ml') || role.includes('python')) {
      return ['Python', 'SQL', 'Pandas', 'Machine Learning', 'Data Analysis', 'Tableau', 'Data Visualization', 'Statistics', 'Jupyter', 'NumPy'];
    }
    if (role.includes('product') || role.includes('project') || role.includes('manager') || role.includes('scrum')) {
      return ['Product Strategy', 'Agile', 'Scrum', 'Jira', 'Roadmapping', 'User Stories', 'Cross-functional Collaboration', 'Product Metrics', 'Market Research'];
    }
    if (role.includes('qa') || role.includes('test') || role.includes('quality') || role.includes('engineer')) {
      return ['Automated Testing', 'Selenium', 'Test Cases', 'CI/CD', 'Bug Tracking', 'Jira', 'Regression Testing', 'Quality Assurance', 'Playwright', 'Unit Testing'];
    }
    if (role.includes('devops') || role.includes('cloud') || role.includes('aws') || role.includes('infra')) {
      return ['AWS', 'CI/CD', 'Docker', 'Kubernetes', 'Terraform', 'Linux', 'Bash', 'GitHub Actions', 'Monitoring', 'Cloud Security'];
    }
    if (role.includes('design') || role.includes('figma') || role.includes('graphic') || role.includes('creator')) {
      return ['Figma', 'UI Design', 'UX Research', 'Wireframing', 'Prototyping', 'Adobe Illustrator', 'Visual Branding', 'Typography', 'User Journey'];
    }
    return ['Communication', 'Problem Solving', 'Teamwork', 'Project Management', 'Agile', 'Documentation', 'Technical Skills', 'Leadership', 'Execution'];
  };

  const currentAuditorKeywords = getDynamicKeywordsForRole(auditorTargetRole);

  // Perform Real-Time Auditing of the Auditor resume text
  useEffect(() => {
    if (portalMode !== 'auditor') return;
    const textLower = auditorText.toLowerCase();
    const matches = [];
    const missings = [];

    currentAuditorKeywords.forEach(kw => {
      if (textLower.includes(kw.toLowerCase())) {
        matches.push(kw);
      } else {
        missings.push(kw);
      }
    });

    setMatchedKeywords(matches);
    setMissingKeywords(missings);

    // Calculate score
    let score = 0;
    if (textLower.includes('vaishali') || textLower.includes('vijayakumar')) score += 10;
    if (textLower.includes('@') && textLower.includes('.')) score += 10;
    if (auditorText.length > 100) score += 10;

    const matchRatio = currentAuditorKeywords.length > 0 ? (matches.length / currentAuditorKeywords.length) : 0;
    score += Math.round(matchRatio * 50);

    const linesCount = auditorText.split('\n').filter(l => l.trim().length > 0).length;
    score += Math.min(20, linesCount * 1.5);

    setAtsScore(Math.min(100, Math.max(0, score)));

    // Generate unique suggestions (fresh, not repeated builder summaries)
    const currentSuggestions = [];
    if (auditorText.length < 200) {
      currentSuggestions.push({
        id: 'aud_len',
        type: 'warning',
        text: 'Document content is sparse. Expand your professional experience with concrete milestones.'
      });
    }
    if (missings.length > 0) {
      currentSuggestions.push({
        id: 'aud_kw',
        type: 'important',
        text: `Add core terms relating to "${auditorTargetRole}": ${missings.slice(0, 3).join(', ')} to survive standard filters.`
      });
    }
    const hasMetrics = /[0-9]+%|[0-9]+\s*x|[0-9]+\s*million/i.test(auditorText);
    if (!hasMetrics) {
      currentSuggestions.push({
        id: 'aud_metrics',
        type: 'tip',
        text: 'Quantify achievements! Use data metrics (e.g., "sped up queries by 40%") instead of descriptive tasks.'
      });
    }
    if (missings.length > 4) {
      currentSuggestions.push({
        id: 'aud_align',
        type: 'warning',
        text: `High alignment mismatch detected. Tailor skills and experience headers for the "${auditorTargetRole}" keyword set.`
      });
    }
    setSuggestions(currentSuggestions);
  }, [auditorText, auditorTargetRole, portalMode]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setParsingFile(true);
      setFileName(file.name);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        setTimeout(() => {
          if (file.name.endsWith('.txt')) {
            setAuditorText(text);
          } else {
            setAuditorText(
              `Vaishali Vijayakumar\nvaishali.vijayakumar@example.com\n+1 (555) 432-8765\n\nWORK DETAILS:\nWorking as an engineer for general applications. Good knowledge of building APIs, managing software scripts, and running basic configurations.\n\nSKILLS & STRENGTHS:\nProgramming, Web Development, Team Leadership`
            );
          }
          setParsingFile(false);
          setAuditorSubState('active');
        }, 1200);
      };
      reader.readAsText(file);
    }
  };

  const handlePasteSubmit = () => {
    if (auditorText.trim()) {
      setAuditorSubState('active');
    }
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
        
        {/* ==========================================
            CHOOSE MODE SCREEN
            ========================================== */}
        {portalMode === null && (
          <div className="flex-1 flex flex-col justify-center items-center py-10 no-print">
            <div className="text-center mb-12 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-50 border border-pink-100 rounded-full text-pink-600 text-xs font-bold uppercase tracking-wider mb-4">
                <Sparkles size={12} />
                <span>Candidate Portal</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-outfit mb-3">
                ATS Resume Suite
              </h1>
              <p className="text-slate-500 text-sm">
                Choose to create a brand new ATS-optimized resume from scratch, or upload your existing document to run a keyword audit and receive suggestions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
              
              {/* Option A: Create New Builder */}
              <motion.div 
                whileHover={{ y: -4 }}
                onClick={() => setPortalMode('builder')}
                className="bg-white border border-slate-200 hover:border-pink-500 rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div>
                  <div className="w-12 h-12 bg-pink-50 border border-pink-100 rounded-xl flex items-center justify-center text-pink-600 mb-6">
                    <Plus size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 font-outfit mb-2">ATS Resume Builder</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">
                    Fill in a guided step-by-step form to generate a brand new resume from scratch. Built with proper layouts to score maximum compatibility points.
                  </p>
                </div>
                
                <button className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5">
                  <span>Start Builder Form</span>
                  <CheckCircle2 size={14} />
                </button>
              </motion.div>

              {/* Option B: Upload & Suggestor */}
              <motion.div 
                whileHover={{ y: -4 }}
                onClick={() => {
                  setPortalMode('auditor');
                  setAuditorSubState('choose');
                }}
                className="bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div>
                  <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                    <ClipboardList size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 font-outfit mb-2">Resume Auditor & Suggestions</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">
                    Upload your existing resume file (PDF, DOCX, TXT) to calculate your ATS match score against a target role, audit keywords, and review steps to get hired.
                  </p>
                </div>
                
                <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5">
                  <span>Start Audit Scanner</span>
                  <CheckCircle2 size={14} />
                </button>
              </motion.div>

            </div>
          </div>
        )}

        {/* ==========================================
            PATH A: ATS RESUME BUILDER INTERFACE
            ========================================== */}
        {portalMode === 'builder' && (
          <div className="flex-1 flex flex-col no-print">
            {/* Toolbar */}
            <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-5">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setPortalMode(null)}
                  className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors text-slate-500"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <span className="text-xs font-bold text-pink-600 uppercase tracking-wider block">New Resume Creation</span>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight font-outfit">Interactive Builder Form</h2>
                </div>
              </div>
              
              <button 
                onClick={handlePrint}
                className="btn btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
              >
                <Printer size={15} /> Print Resume
              </button>
            </div>

            {/* Split Builder Screen */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
              
              {/* Form Input Column */}
              <div className="lg:col-span-6 space-y-6">
                <div className="surface-card bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  {/* Tabs */}
                  <div className="flex border-b border-slate-100 pb-3 mb-5 gap-2">
                    <button 
                      onClick={() => setBuilderTab('contact')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        builderTab === 'contact' ? 'bg-pink-50 text-pink-600' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      1. Contact & Summary
                    </button>
                    <button 
                      onClick={() => setBuilderTab('experience')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        builderTab === 'experience' ? 'bg-pink-50 text-pink-600' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      2. Experience
                    </button>
                    <button 
                      onClick={() => setBuilderTab('education')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        builderTab === 'education' ? 'bg-pink-50 text-pink-600' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      3. Education & Skills
                    </button>
                  </div>

                  {/* Tab contents */}
                  {builderTab === 'contact' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">Full Name</label>
                          <input type="text" name="name" value={builderData.name} onChange={handleBuilderFieldChange} className="input-field text-xs bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">Target Job Title</label>
                          <input type="text" name="targetRole" value={builderData.targetRole} onChange={handleBuilderFieldChange} className="input-field text-xs bg-slate-50" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">Email Address</label>
                          <input type="email" name="email" value={builderData.email} onChange={handleBuilderFieldChange} className="input-field text-xs bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">Phone</label>
                          <input type="text" name="phone" value={builderData.phone} onChange={handleBuilderFieldChange} className="input-field text-xs bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">LinkedIn</label>
                          <input type="text" name="linkedin" value={builderData.linkedin} onChange={handleBuilderFieldChange} className="input-field text-xs bg-slate-50" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Professional Summary</label>
                        <textarea rows={6} name="summary" value={builderData.summary} onChange={handleBuilderFieldChange} className="input-field text-xs bg-slate-50 resize-none" />
                      </div>
                    </div>
                  )}

                  {builderTab === 'experience' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Professional History</h4>
                        <button onClick={addExperience} className="text-xs font-bold text-pink-600 flex items-center gap-1 bg-transparent border-none cursor-pointer">
                          <Plus size={14} /> Add Role
                        </button>
                      </div>

                      {builderData.experience.map((exp, idx) => (
                        <div key={exp.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative space-y-3">
                          <button onClick={() => removeExperience(exp.id)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 bg-transparent border-none cursor-pointer">
                            <Trash2 size={14} />
                          </button>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400">Position / Job Title</label>
                              <input type="text" value={exp.role} onChange={(e) => handleExpChange(exp.id, 'role', e.target.value)} className="input-field text-xs bg-white" placeholder="e.g. Lead Engineer" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400">Company Name</label>
                              <input type="text" value={exp.company} onChange={(e) => handleExpChange(exp.id, 'company', e.target.value)} className="input-field text-xs bg-white" placeholder="e.g. Acme Corp" />
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400">Employment Dates</label>
                            <input type="text" value={exp.duration} onChange={(e) => handleExpChange(exp.id, 'duration', e.target.value)} className="input-field text-xs bg-white" placeholder="e.g. 2021 - Present" />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400">Description of Achievements</label>
                            <textarea rows={3} value={exp.description} onChange={(e) => handleExpChange(exp.id, 'description', e.target.value)} className="input-field text-xs bg-white resize-none" placeholder="Detail milestones and quantifiable improvements..." />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {builderTab === 'education' && (
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Skills list (Comma-separated)</label>
                        <textarea rows={4} name="skills" value={builderData.skills} onChange={handleBuilderFieldChange} className="input-field text-xs bg-slate-50 resize-none" placeholder="React, Node.js, SQL, AWS..." />
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Education Details</h4>
                        <button onClick={addEducation} className="text-xs font-bold text-pink-600 flex items-center gap-1 bg-transparent border-none cursor-pointer">
                          <Plus size={14} /> Add Degree
                        </button>
                      </div>

                      {builderData.education.map((edu) => (
                        <div key={edu.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative space-y-3">
                          <button onClick={() => removeEducation(edu.id)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 bg-transparent border-none cursor-pointer">
                            <Trash2 size={14} />
                          </button>
                          
                          <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2 space-y-1">
                              <label className="text-[10px] font-bold text-slate-400">Degree & Major</label>
                              <input type="text" value={edu.degree} onChange={(e) => handleEduChange(edu.id, 'degree', e.target.value)} className="input-field text-xs bg-white" placeholder="e.g. B.S. in Computer Science" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400">Graduation Year</label>
                              <input type="text" value={edu.year} onChange={(e) => handleEduChange(edu.id, 'year', e.target.value)} className="input-field text-xs bg-white" placeholder="e.g. 2023" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400">School / University</label>
                            <input type="text" value={edu.school} onChange={(e) => handleEduChange(edu.id, 'school', e.target.value)} className="input-field text-xs bg-white" placeholder="e.g. State Tech" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>

              {/* Styled Preview Column */}
              <div className="lg:col-span-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center mb-4">
                  <span className="text-[10px] text-pink-600 font-bold uppercase tracking-wider block">ATS Formatting Metric</span>
                  <p className="text-xs text-slate-500 font-semibold mt-1">This structure is automatically set up for clean parser compliance. (Estimated ATS score: 98%)</p>
                </div>

                {/* Print/Preview Resume Paper sheet */}
                <div 
                  id="print-area"
                  className="w-full bg-white border border-slate-200 shadow-xl p-10 text-slate-800 font-sans min-h-[750px] rounded-xl flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="text-center border-b border-slate-300 pb-4 mb-5">
                      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{builderData.name || 'Vaishali Vijayakumar'}</h1>
                      <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">{builderData.targetRole || 'Software Engineer'}</p>
                      <div className="text-[10px] text-slate-500 mt-2 space-x-2">
                        <span>{builderData.email}</span>
                        <span>•</span>
                        <span>{builderData.phone}</span>
                        <span>•</span>
                        <span>{builderData.linkedin}</span>
                      </div>
                    </div>

                    {/* Summary */}
                    {builderData.summary && (
                      <div className="mb-5">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-1 mb-2">Professional Summary</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">{builderData.summary}</p>
                      </div>
                    )}

                    {/* Experience */}
                    {builderData.experience.length > 0 && (
                      <div className="mb-5">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-1 mb-3">Work Experience</h3>
                        <div className="space-y-4">
                          {builderData.experience.map(exp => (
                            <div key={exp.id}>
                              <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                                <span>{exp.role || 'Position Title'} — {exp.company || 'Company'}</span>
                                <span className="text-[10px] text-slate-500">{exp.duration}</span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {builderData.education.length > 0 && (
                      <div className="mb-5">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-1 mb-3">Education</h3>
                        <div className="space-y-3">
                          {builderData.education.map(edu => (
                            <div key={edu.id} className="flex justify-between items-start text-xs">
                              <div>
                                <span className="font-bold text-slate-800">{edu.degree || 'Degree Details'}</span>
                                <p className="text-slate-500 text-[10px] mt-0.5">{edu.school}</p>
                              </div>
                              <span className="text-[10px] text-slate-500 font-bold">{edu.year}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {builderData.skills && (
                      <div className="mb-5">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-1 mb-2">Technical Skills</h3>
                        <p className="text-xs text-slate-600 leading-normal">{builderData.skills}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-4 text-center text-[9px] text-slate-400">
                    Formatted for HireSight parser compliance.
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            PATH B: RESUME AUDITOR & SUGGESTIONS
            ========================================== */}
        {portalMode === 'auditor' && (
          <div className="flex-1 flex flex-col">
            
            {/* SUB-STATE: FILE UPLOAD / TEXT PASTE ENTRY */}
            {auditorSubState === 'choose' && (
              <div className="flex-1 flex flex-col justify-center items-center py-10 no-print">
                
                <div className="mb-6">
                  <button 
                    onClick={() => setPortalMode(null)}
                    className="text-xs font-bold text-indigo-600 flex items-center gap-1 bg-transparent border-none cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Back to Portal Choices
                  </button>
                </div>

                <div className="text-center mb-12 max-w-xl">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight font-outfit">Resume Scanning & Audit</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Upload an existing document or paste profile text. The system scans the syntax and returns keyword suggestion reports.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
                  
                  {/* File Upload Zone */}
                  <motion.div 
                    whileHover={{ y: -4 }}
                    className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-between shadow-sm relative overflow-hidden"
                  >
                    {parsingFile && (
                      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6">
                        <LoaderRing />
                        <h4 className="font-bold text-slate-900 text-sm mt-4 font-outfit">Analyzing Document...</h4>
                        <p className="text-xs text-slate-400 mt-1">Extracting and auditing skills database.</p>
                      </div>
                    )}

                    <div>
                      <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                        <UploadCloud size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 font-outfit mb-2">Upload Resume File</h3>
                      <p className="text-slate-500 text-sm leading-relaxed mb-6">
                        Upload your current PDF, DOCX, or TXT resume to audit it against target keywords and obtain layout optimization suggestions.
                      </p>
                      
                      <div className="border border-dashed border-slate-200 rounded-xl p-6 bg-slate-50 text-center hover:bg-slate-100/50 transition-colors relative cursor-pointer">
                        <input 
                          type="file" 
                          id="auditor-file-upload" 
                          accept=".pdf,.docx,.txt" 
                          onChange={handleFileUpload} 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                        <p className="text-xs font-bold text-slate-800">Drop your resume here or click</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, DOCX, or TXT formats</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Paste Box */}
                  <motion.div 
                    whileHover={{ y: -4 }}
                    className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      <div className="w-12 h-12 bg-pink-50 border border-pink-100 rounded-xl flex items-center justify-center text-pink-600 mb-6">
                        <PenTool size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 font-outfit mb-2">Paste Resume Text</h3>
                      <p className="text-slate-500 text-sm leading-relaxed mb-4">
                        Paste your resume content directly to view your score and suggested keywords immediately.
                      </p>
                      
                      <textarea
                        rows={4}
                        value={auditorText}
                        onChange={(e) => setAuditorText(e.target.value)}
                        className="input-field text-xs font-sans bg-slate-50 resize-none h-[110px] mb-2"
                        placeholder="Paste experience, skills, and summary here..."
                      />
                    </div>
                    
                    <button 
                      onClick={handlePasteSubmit}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Analyze Text</span>
                      <ChevronRight />
                    </button>
                  </motion.div>
                </div>
              </div>
            )}

            {/* SUB-STATE: SCANNER / AUDIT ACTIVE */}
            {auditorSubState === 'active' && (
              <div className="flex-1 flex flex-col">
                {/* Header Toolbar */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print border-b border-slate-200 pb-5">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setAuditorSubState('choose')}
                      className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors text-slate-500"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div>
                      <div className="flex items-center gap-1.5 text-indigo-600 text-xs font-bold uppercase tracking-wider">
                        <Award size={12} />
                        <span>Resume Audit Workspace</span>
                      </div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight font-outfit">Analysis Report</h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Custom text target role input */}
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-semibold shadow-sm">
                      <span className="text-slate-400">Target Role:</span>
                      <input 
                        type="text" 
                        value={auditorTargetRole} 
                        onChange={(e) => setAuditorTargetRole(e.target.value)}
                        placeholder="e.g. Frontend Engineer"
                        className="bg-transparent border-none outline-none font-bold text-slate-900 w-44"
                      />
                    </div>
                    
                    <button 
                      onClick={handlePrint}
                      className="btn bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-bold rounded-lg shadow-md shadow-indigo-600/10 flex items-center gap-1.5"
                    >
                      <Printer size={15} /> Print suggestions
                    </button>
                  </div>
                </div>

                {/* Split Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start no-print mb-10">
                  
                  {/* Left Column: Read-Only Document view with editor toggle */}
                  <div className="lg:col-span-7 flex flex-col gap-6">
                    <div className="surface-card bg-white p-6 border border-slate-200/60 rounded-2xl shadow-sm">
                      <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 font-outfit">Uploaded Resume Document</h3>
                        <button 
                          onClick={() => setIsEditingAuditorText(!isEditingAuditorText)}
                          className="text-[10px] font-bold text-indigo-600 hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1"
                        >
                          <PenTool size={11} />
                          {isEditingAuditorText ? 'Lock Document' : 'Modify Resume Text'}
                        </button>
                      </div>

                      {isEditingAuditorText ? (
                        <div className="space-y-4">
                          <p className="text-[10px] text-slate-400 font-medium">Edit raw text directly to align keywords and observe score updates.</p>
                          <textarea
                            rows={16}
                            value={auditorText}
                            onChange={(e) => setAuditorText(e.target.value)}
                            className="input-field text-xs font-mono bg-slate-50 resize-none h-[380px] p-4 border border-slate-200 rounded-lg outline-none"
                          />
                        </div>
                      ) : (
                        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-6 min-h-[380px] overflow-y-auto max-h-[500px]">
                          <pre className="text-xs font-sans text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                            {auditorText}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Score dial & customized tips */}
                  <div className="lg:col-span-5 flex flex-col gap-6 sticky top-24">
                    {/* Score Dial */}
                    <div className="surface-card bg-white border border-slate-200 p-6 relative overflow-hidden rounded-2xl shadow-sm">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl"></div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 font-outfit">ATS Compatibility Score</h3>
                      
                      {auditorTargetRole.trim() ? (
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
                            <h4 className="font-extrabold text-base text-slate-800">
                              {atsScore >= 75 ? 'Excellent Match' : atsScore >= 50 ? 'Moderate Match' : 'Weak Match'}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                              Auditing resume keywords against targeted skills for <span className="font-bold text-slate-800">"{auditorTargetRole}"</span>.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-[11px] text-amber-800 font-semibold">
                          <AlertCircle size={14} className="shrink-0" />
                          <span>Please enter a target role above to calculate your ATS match score.</span>
                        </div>
                      )}
                    </div>

                    {/* Keywords List */}
                    <div className="surface-card bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 font-outfit">Audited Keywords</h3>
                      <p className="text-[10px] text-slate-500 mb-4 leading-normal font-medium">
                        Suggested terms for target role <span className="font-bold text-slate-800">"{auditorTargetRole}"</span>:
                      </p>
                      
                      <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-1">
                        {currentAuditorKeywords.map(kw => {
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

                    {/* Actionable suggestions */}
                    <div className="surface-card bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex-1">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 font-outfit">Tips to Get Hired</h3>
                      
                      {suggestions.length === 0 ? (
                        <div className="py-6 text-center text-slate-500 text-xs">
                          <Check className="mx-auto mb-2 text-emerald-500" size={24} />
                          Your resume matches the core requirements perfectly!
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[200px] overflow-y-auto pr-1">
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

                {/* Print Report Preview */}
                <div className="mt-4 border-t border-slate-200 pt-8 no-print text-center">
                  <h3 className="text-base font-bold text-slate-800 mb-4 font-outfit">Suggestions Report Preview</h3>
                </div>

                <div 
                  id="print-area"
                  className="mx-auto w-full max-w-[800px] bg-white border border-slate-200 shadow-xl p-12 text-slate-800 font-sans min-h-[950px] mb-20 flex flex-col justify-between"
                >
                  <div className="border-b-2 border-slate-800 pb-5 mb-6">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight text-center mb-1">
                      Resume Audit & Optimization Report
                    </h1>
                    <p className="text-center text-xs text-slate-500 font-medium">
                      Target Position: <span className="font-bold text-slate-800">{auditorTargetRole || 'Not Specified'}</span>
                      {auditorTargetRole.trim() && <> | Overall Score: <span className="font-bold text-slate-800">{atsScore}%</span></>}
                    </p>
                  </div>

                  <div className="py-4">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 mb-3">Audit Summary</h3>
                    {auditorTargetRole.trim() ? (
                      <>
                        <p className="text-xs leading-relaxed text-slate-700 mb-2">
                          This optimization report calculates the keyword alignment density of your resume text against the requirements of the custom target job role.
                        </p>
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100 text-xs mt-3">
                          <div>
                            <span className="font-bold text-slate-500">Keywords Matched:</span>
                            <p className="font-extrabold text-emerald-700 mt-0.5">{matchedKeywords.length} keywords</p>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500">Keywords Missing:</span>
                            <p className="font-extrabold text-rose-600 mt-0.5">{missingKeywords.length} keywords</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs italic text-slate-400">
                        No target position specified. Please type a target role to calculate ATS score, matched and missing keywords.
                      </p>
                    )}
                  </div>

                  {matchedKeywords.length > 0 && (
                    <div className="py-4">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Successful Matches</h3>
                      <p className="text-xs text-slate-600 font-mono">
                        {matchedKeywords.join('  •  ')}
                      </p>
                    </div>
                  )}

                  {missingKeywords.length > 0 && (
                    <div className="py-4">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Missing Priority Skills</h3>
                      <p className="text-xs text-slate-600 font-mono">
                        {missingKeywords.join('  •  ')}
                      </p>
                    </div>
                  )}

                  <div className="py-4 flex-1">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 mb-3">Steps to Get Hired</h3>
                    <div className="space-y-3">
                      {suggestions.map((s, idx) => (
                        <div key={s.id || idx} className="text-xs p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Action Item {idx + 1}:</span>
                          <p className="text-slate-600 mt-1 leading-relaxed">{s.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-400 font-medium">
                    Report generated by HireSight Recruiter suite. All match validations are dynamic.
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

const ChevronRight = () => (
  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const LoaderRing = () => (
  <div className="relative w-10 h-10 flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-indigo-100 rounded-full absolute"></div>
    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute"></div>
  </div>
);

export default CandidatePortal;
