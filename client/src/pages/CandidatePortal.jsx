import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Sparkles, Award, CheckCircle2, AlertCircle, Printer, 
  UploadCloud, ArrowLeft, RefreshCw, Check, ClipboardList, PenTool
} from 'lucide-react';

const CandidatePortal = () => {
  const [selectedOption, setSelectedOption] = useState(null); // null, 'pasted', 'uploaded'
  const [targetRole, setTargetRole] = useState('Frontend Engineer');
  const [resumeText, setResumeText] = useState(
    `Vaishali Vijayakumar\nvaishali.vijayakumar@example.com\n+1 (555) 432-8765\nlinkedin.com/in/vaishalivijayakumar\n\nProfessional software engineer focused on building highly responsive, scalable web applications. Expert in clean code patterns, frontend architectures, and optimizing workflow performance.\n\nSKILLS:\nReact, JavaScript, HTML, CSS, Git, TailwindCSS\n\nEXPERIENCE:\nSoftware Engineer | Innovation Hub (2024 - Present)\nLed development of client dashboard features. Enhanced user experience metrics by 30% and introduced component libraries.`
  );
  const [isEditingText, setIsEditingText] = useState(false);
  const [parsingFile, setParsingFile] = useState(false);
  const [fileName, setFileName] = useState('');

  // Recommendation panel states
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
    // General fallbacks for other roles
    return ['Communication', 'Problem Solving', 'Teamwork', 'Project Management', 'Agile', 'Documentation', 'Technical Skills', 'Leadership', 'Execution'];
  };

  const currentKeywords = getDynamicKeywordsForRole(targetRole);

  // Perform ATS Score Audit in real-time
  useEffect(() => {
    const textLower = resumeText.toLowerCase();
    const matches = [];
    const missings = [];

    currentKeywords.forEach(kw => {
      if (textLower.includes(kw.toLowerCase())) {
        matches.push(kw);
      } else {
        missings.push(kw);
      }
    });

    setMatchedKeywords(matches);
    setMissingKeywords(missings);

    // Calculate dynamic ATS Score (0-100)
    let score = 0;

    // Base score check
    if (textLower.includes('vaishali') || textLower.includes('vijayakumar')) score += 10;
    if (textLower.includes('@') && textLower.includes('.')) score += 10; // Email check
    if (resumeText.length > 100) score += 10;

    const matchRatio = currentKeywords.length > 0 ? (matches.length / currentKeywords.length) : 0;
    score += Math.round(matchRatio * 50);

    const linesCount = resumeText.split('\n').filter(l => l.trim().length > 0).length;
    score += Math.min(20, linesCount * 1.5);

    setAtsScore(Math.min(100, Math.max(0, score)));

    // Generate actionable improvement suggestions
    const currentSuggestions = [];
    if (resumeText.length < 250) {
      currentSuggestions.push({
        id: 's_len',
        type: 'warning',
        text: 'Your resume seems short. Write an introductory professional summary detailing your core qualifications.'
      });
    }
    if (missings.length > 0) {
      currentSuggestions.push({
        id: 's_kw',
        type: 'important',
        text: `Target role keywords missing: ${missings.slice(0, 3).join(', ')}. Incorporate these into your experience or skills list to bypass filters.`
      });
    }
    const hasNumbers = /[0-9]+%|[0-9]+\s*x|[0-9]+\s*million/i.test(resumeText);
    if (!hasNumbers) {
      currentSuggestions.push({
        id: 's_metrics',
        type: 'tip',
        text: 'Add quantifiable metrics (e.g., "reduced latency by 20%" or "managed 5 core modules") to prove impact.'
      });
    }
    if (missings.length > 4) {
      currentSuggestions.push({
        id: 's_align',
        type: 'warning',
        text: `Your resume has low semantic alignment with "${targetRole}". Standardize terminology to raise match rate.`
      });
    }
    setSuggestions(currentSuggestions);
  }, [resumeText, targetRole, currentKeywords]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setParsingFile(true);
      setFileName(file.name);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        // Read file contents if plain text, otherwise mock load
        const text = event.target.result;
        setTimeout(() => {
          if (file.name.endsWith('.txt')) {
            setResumeText(text);
          } else {
            // Keep default name "Vaishali Vijayakumar" and prefill sample content for PDFs/DOCX
            setResumeText(
              `Vaishali Vijayakumar\nvaishali.vijayakumar@example.com\n+1 (555) 432-8765\n\nPROFESSIONAL SUMMARY:\nHighly qualified candidate focused on delivering technical excellence. Skilled in working within agile engineering teams, managing repositories, and writing clean structures.\n\nTECHNICAL STRENGTHS:\nDevelopment, Git, Collaboration, Office Suites, Project Management`
            );
          }
          setParsingFile(false);
          setSelectedOption('uploaded');
        }, 1200);
      };
      reader.readAsText(file);
    }
  };

  const handlePasteSubmit = () => {
    if (resumeText.trim()) {
      setSelectedOption('pasted');
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
        
        {/* ENTRY SELECTION / UPLOAD SCREEN */}
        {selectedOption === null && (
          <div className="flex-1 flex flex-col justify-center items-center py-10 no-print">
            
            <div className="text-center mb-12 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4">
                <ClipboardList size={12} />
                <span>Resume Audit Center</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-outfit mb-3">
                ATS Optimizer Workspace
              </h1>
              <p className="text-slate-500 text-sm">
                Upload your resume document or paste your profile text below. Enter the job role you want to target to receive instant optimization tips and keyword alignment suggestions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
              
              {/* Option A: Upload Existing */}
              <motion.div 
                whileHover={{ y: -4 }}
                className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden"
              >
                {parsingFile && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6">
                    <LoaderRing />
                    <h4 className="font-bold text-slate-900 text-sm mt-4 font-outfit">Analyzing Document...</h4>
                    <p className="text-xs text-slate-400 mt-1">Extracting resume fields and content structure.</p>
                  </div>
                )}

                <div>
                  <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                    <UploadCloud size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 font-outfit mb-2">Upload Resume File</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">
                    Upload your current resume (PDF, DOCX, or TXT) to audit it against target keywords and obtain layout optimization suggestions.
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
                  Default candidate profile will be verified as Vaishali Vijayakumar.
                </div>
              </motion.div>

              {/* Option B: Paste Text */}
              <motion.div 
                whileHover={{ y: -4 }}
                className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all"
              >
                <div>
                  <div className="w-12 h-12 bg-pink-50 border border-pink-100 rounded-xl flex items-center justify-center text-pink-600 mb-6">
                    <PenTool size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 font-outfit mb-2">Paste Resume Text</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-4">
                    Paste your resume text directly into the text editor below to quickly calculate your score and match keywords.
                  </p>
                  
                  <textarea
                    rows={4}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    className="input-field text-xs font-sans bg-slate-50 resize-none h-[110px] mb-2"
                    placeholder="Paste email, experience, skills, and summary here..."
                  />
                </div>
                
                <button 
                  onClick={handlePasteSubmit}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1"
                >
                  <span>Parse & Analyze Text</span>
                  <ChevronRight />
                </button>
              </motion.div>

            </div>

          </div>
        )}

        {/* WORKSPACE VIEW (Active once file/text is loaded) */}
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
                    <Award size={12} />
                    <span>Resume Audit Workspace</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight font-outfit">
                    Analysis Report
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Target Role TEXT INPUT (Not dropdown) */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-semibold shadow-sm">
                  <span className="text-slate-400">Target Role:</span>
                  <input 
                    type="text" 
                    value={targetRole} 
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Frontend Engineer"
                    className="bg-transparent border-none outline-none font-bold text-slate-900 w-44"
                  />
                </div>
                
                <button 
                  onClick={handlePrint}
                  className="btn bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-bold rounded-lg shadow-md shadow-indigo-600/10 flex items-center gap-1.5"
                >
                  <Printer size={15} />
                  <span>Print suggestions</span>
                </button>
              </div>
            </div>

            {/* Split Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start no-print mb-10">
              
              {/* Document Sheet Side */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                <div className="surface-card bg-white p-6 border border-slate-200/60 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 font-outfit">Uploaded Resume Document</h3>
                    <button 
                      onClick={() => setIsEditingText(!isEditingText)}
                      className="text-[10px] font-bold text-indigo-600 hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1"
                    >
                      <PenTool size={11} />
                      {isEditingText ? 'Lock Document' : 'Modify Resume Text'}
                    </button>
                  </div>

                  {isEditingText ? (
                    <div className="space-y-4">
                      <p className="text-[10px] text-slate-400 font-medium">Edit the raw text below to add missing keywords and see your match score update in real-time.</p>
                      <textarea
                        rows={16}
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        className="input-field text-xs font-mono bg-slate-50 resize-none h-[380px] p-4 border border-slate-200 rounded-lg outline-none"
                      />
                    </div>
                  ) : (
                    <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-6 min-h-[380px] overflow-y-auto max-h-[500px]">
                      <pre className="text-xs font-sans text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                        {resumeText}
                      </pre>
                    </div>
                  )}

                </div>

              </div>

              {/* Auditor & Suggestions Side */}
              <div className="lg:col-span-5 flex flex-col gap-6 sticky top-24">
                
                {/* ATS score dial */}
                <div className="surface-card bg-white border border-slate-200 p-6 relative overflow-hidden rounded-2xl shadow-sm">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl"></div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 font-outfit">ATS Compatibility Score</h3>
                  
                  {targetRole.trim() ? (
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
                          Auditing resume keywords against targeted skills for <span className="font-bold text-slate-800">"{targetRole}"</span>.
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

                {/* Dynamic Keywords suggested based on text role input */}
                <div className="surface-card bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 font-outfit">Dynamically Audited Keywords</h3>
                  <p className="text-[10px] text-slate-500 mb-4 leading-normal font-medium">
                    Suggested keyword list generated for your custom input role <span className="font-bold text-slate-800">"{targetRole}"</span>:
                  </p>
                  
                  <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-1">
                    {currentKeywords.map(kw => {
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

                {/* Actionable tips to improve and get hired */}
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

            {/* A4 Sheet Print preview of suggestions report */}
            <div className="mt-4 border-t border-slate-200 pt-8 no-print">
              <h3 className="text-base font-bold text-slate-800 mb-4 font-outfit text-center">Suggestions Report Preview</h3>
            </div>

            <div 
              id="print-area"
              className="mx-auto w-full max-w-[800px] bg-white border border-slate-200 shadow-xl p-12 text-slate-800 font-sans min-h-[950px] mb-20 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="border-b-2 border-slate-800 pb-5 mb-6">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight text-center mb-1">
                  Resume Audit & Optimization Report
                </h1>
                <p className="text-center text-xs text-slate-500 font-medium">
                  Target Position: <span className="font-bold text-slate-800">{targetRole || 'Not Specified'}</span>
                  {targetRole.trim() && <> | Overall Score: <span className="font-bold text-slate-800">{atsScore}%</span></>}
                </p>
              </div>

              {/* Match overview */}
              <div className="py-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 mb-3">Audit Summary</h3>
                {targetRole.trim() ? (
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

              {/* Matched Keywords */}
              {matchedKeywords.length > 0 && (
                <div className="py-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Successful Matches</h3>
                  <p className="text-xs leading-relaxed text-slate-700 mb-3">
                    These keywords were successfully parsed from your profile details and align with role expectations:
                  </p>
                  <p className="text-xs text-slate-600 font-mono">
                    {matchedKeywords.join('  •  ')}
                  </p>
                </div>
              )}

              {/* Missing Keywords */}
              {missingKeywords.length > 0 && (
                <div className="py-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Missing Priority Skills</h3>
                  <p className="text-xs leading-relaxed text-slate-700 mb-3">
                    To bypass screening filters, consider incorporating these technical and operational terms into your resume details:
                  </p>
                  <p className="text-xs text-slate-600 font-mono">
                    {missingKeywords.join('  •  ')}
                  </p>
                </div>
              )}

              {/* Actionable recommendations */}
              <div className="py-4 flex-1">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 mb-3">Steps to Get Hired</h3>
                
                <div className="space-y-3">
                  {suggestions.map((s, idx) => (
                    <div key={s.id || idx} className="text-xs p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Action Item {idx + 1}:</span>
                      <p className="text-slate-600 mt-1 leading-relaxed">{s.text}</p>
                    </div>
                  ))}
                  {suggestions.length === 0 && (
                    <p className="text-xs text-slate-500">Your profile text aligns perfectly. Ready for submission.</p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-400 font-medium">
                Report generated by HireSight Recruiter suite. All match validations are dynamic.
              </div>

            </div>
          </>
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
