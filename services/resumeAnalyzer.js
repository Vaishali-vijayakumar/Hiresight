const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const natural = require('natural');
const keywordExtractor = require('keyword-extractor');
const compromise = require('compromise');
const Sentiment = require('sentiment');

class ResumeAnalyzer {
    constructor() {
        this.sentiment = new Sentiment();
        
        // Industry-specific keywords database
        this.industryKeywords = {
            'technology': [
                'JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes',
                'Machine Learning', 'AI', 'Data Science', 'SQL', 'MongoDB', 'API', 'Git',
                'Agile', 'DevOps', 'Cloud Computing', 'Microservices', 'REST', 'GraphQL'
            ],
            'marketing': [
                'SEO', 'SEM', 'Google Analytics', 'Social Media', 'Content Marketing',
                'Email Marketing', 'PPC', 'Conversion Rate', 'Brand Management',
                'Digital Marketing', 'Campaign Management', 'Market Research'
            ],
            'finance': [
                'Financial Analysis', 'Excel', 'Financial Modeling', 'Investment',
                'Risk Management', 'Accounting', 'Budget', 'Forecasting', 'Compliance',
                'Portfolio Management', 'Financial Planning'
            ],
            'sales': [
                'CRM', 'Lead Generation', 'Sales Funnel', 'Customer Acquisition',
                'Revenue Growth', 'Account Management', 'Negotiation', 'Pipeline Management',
                'B2B Sales', 'B2C Sales', 'Sales Analytics'
            ]
        };

        // ATS-friendly formatting checks
        this.atsChecks = {
            sections: [
                'contact information', 'summary', 'experience', 'education', 
                'skills', 'certifications', 'achievements'
            ],
            avoidWords: ['references available upon request', 'salary negotiable'],
            preferredFormats: ['.pdf', '.docx'],
            maxLength: 2 // pages
        };

        // Common resume sections patterns
        this.sectionPatterns = {
            contact: /(contact|phone|email|address|linkedin)/i,
            summary: /(summary|objective|profile|about)/i,
            experience: /(experience|work|employment|career|professional)/i,
            education: /(education|academic|degree|university|college)/i,
            skills: /(skills|competencies|expertise|proficiencies)/i,
            achievements: /(achievements|accomplishments|awards|honors)/i,
            certifications: /(certifications|licenses|credentials)/i
        };
        
        // Pre-compiled regex patterns for better performance
        this.compiledPatterns = {
            quantifiedAchievements: /\d+%|\$\d+|\d+\+|increased|decreased|improved|reduced/gi,
            actionWords: /(managed|led|developed|implemented|created|designed|optimized)/gi,
            companyNames: /[A-Z][a-z]+ (?:Inc|LLC|Corp|Company|Corporation|Ltd)/g,
            dates: /\d{4}|\d{1,2}\/\d{4}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/gi,
            degreeMention: /(bachelor|master|phd|degree|diploma|certificate)/gi,
            institution: /(university|college|institute|school)/gi,
            graduation: /\d{4}|graduated|graduation/gi,
            gpa: /gpa|grade/gi,
            consistentBullets: /^[\s]*[•\-\*]\s/m,
            capitalizedHeaders: /^[A-Z\s]+$/m,
            dateFormatting: /\d{4}|\d{1,2}\/\d{4}/g
        };
    }

    // Main analysis function
    async analyzeResume(fileBuffer, filename, jobDescription = '') {
        try {
            // Extract text from resume
            const extractedText = await this.extractText(fileBuffer, filename);
            
            // Perform comprehensive analysis
            const analysis = {
                textContent: extractedText,
                filename: filename,
                analysisTimestamp: new Date(),
                
                // Core analysis components
                sections: this.analyzeSections(extractedText),
                keywords: this.analyzeKeywords(extractedText, jobDescription),
                atsCompatibility: this.checkATSCompatibility(extractedText, filename),
                contentQuality: this.analyzeContentQuality(extractedText),
                formatScore: this.analyzeFormat(extractedText, filename),
                
                // Advanced analysis
                sentiment: this.analyzeSentiment(extractedText),
                readability: this.analyzeReadability(extractedText),
                
                // Generate scores and suggestions
                scores: {},
                suggestions: []
            };

            // Calculate overall scores
            analysis.scores = this.calculateScores(analysis);
            
            // Generate improvement suggestions
            analysis.suggestions = this.generateSuggestions(analysis);
            
            return analysis;

        } catch (error) {
            console.error('Resume analysis error:', error);
            throw new Error('Failed to analyze resume: ' + error.message);
        }
    }

    // Extract text content from different file formats
    async extractText(buffer, filename) {
        const extension = filename.toLowerCase().split('.').pop();
        
        try {
            switch (extension) {
                case 'pdf':
                    const pdfData = await pdfParse(buffer);
                    return pdfData.text;
                    
                case 'docx':
                    const docxResult = await mammoth.extractRawText({ buffer: buffer });
                    return docxResult.value;
                    
                case 'doc':
                    // For .doc files, we'll try mammoth as well (limited support)
                    const docResult = await mammoth.extractRawText({ buffer: buffer });
                    return docResult.value;
                    
                default:
                    throw new Error('Unsupported file format');
            }
        } catch (error) {
            throw new Error(`Text extraction failed: ${error.message}`);
        }
    }

    // Analyze resume sections
    analyzeSections(text) {
        const sections = {};
        const textLower = text.toLowerCase();
        
        // Check for each section type
        Object.keys(this.sectionPatterns).forEach(sectionType => {
            const pattern = this.sectionPatterns[sectionType];
            sections[sectionType] = {
                present: pattern.test(textLower),
                content: this.extractSectionContent(text, sectionType),
                strength: 0 // Will be calculated based on content
            };
        });

        // Analyze section strength
        this.analyzeSectionStrength(sections, text);
        
        return sections;
    }

    // Extract content for specific sections
    extractSectionContent(text, sectionType) {
        const lines = text.split('\n');
        const sectionContent = [];
        let inSection = false;
        const pattern = this.sectionPatterns[sectionType];

        for (let line of lines) {
            if (pattern.test(line)) {
                inSection = true;
                continue;
            }
            
            // Stop if we hit another section
            if (inSection && this.isNewSection(line)) {
                break;
            }
            
            if (inSection && line.trim()) {
                sectionContent.push(line.trim());
            }
        }

        return sectionContent.slice(0, 5); // Limit to first 5 relevant lines
    }

    // Check if line indicates a new section
    isNewSection(line) {
        const commonSections = [
            'experience', 'education', 'skills', 'summary', 'contact',
            'achievements', 'certifications', 'projects'
        ];
        
        return commonSections.some(section => 
            line.toLowerCase().includes(section) && 
            line.length < 30 // Likely a header, not content
        );
    }

    // Analyze section strength and completeness
    analyzeSectionStrength(sections, text) {
        // Experience section analysis
        if (sections.experience.present) {
            const experienceMetrics = this.analyzeExperience(text);
            sections.experience.strength = experienceMetrics.score;
            sections.experience.details = experienceMetrics;
        }

        // Skills section analysis
        if (sections.skills.present) {
            const skillsMetrics = this.analyzeSkills(text);
            sections.skills.strength = skillsMetrics.score;
            sections.skills.details = skillsMetrics;
        }

        // Education section analysis
        if (sections.education.present) {
            const educationMetrics = this.analyzeEducation(text);
            sections.education.strength = educationMetrics.score;
            sections.education.details = educationMetrics;
        }
    }

    // Analyze experience section
    analyzeExperience(text) {
        // Reset regex patterns to avoid global flag issues
        this.compiledPatterns.quantifiedAchievements.lastIndex = 0;
        this.compiledPatterns.actionWords.lastIndex = 0;
        this.compiledPatterns.dates.lastIndex = 0;
        
        const hasQuantifiedAchievements = this.compiledPatterns.quantifiedAchievements.test(text);
        const hasActionWords = this.compiledPatterns.actionWords.test(text);
        const hasCompanyNames = text.match(this.compiledPatterns.companyNames) || [];
        const hasDates = text.match(this.compiledPatterns.dates) || [];

        let score = 0;
        if (hasQuantifiedAchievements) score += 25;
        if (hasActionWords) score += 20;
        if (hasCompanyNames.length > 0) score += 20;
        if (hasDates.length > 2) score += 15;
        if (text.split('\n').length > 5) score += 20; // Sufficient detail

        return {
            score: Math.min(score, 100),
            hasQuantifiedAchievements,
            hasActionWords,
            companyCount: hasCompanyNames.length,
            dateCount: hasDates.length
        };
    }

    // Analyze skills section
    analyzeSkills(text) {
        const allKeywords = Object.values(this.industryKeywords).flat();
        const foundSkills = allKeywords.filter(skill => 
            text.toLowerCase().includes(skill.toLowerCase())
        );

        const technicalSkills = foundSkills.filter(skill => 
            this.industryKeywords.technology.includes(skill)
        );

        let score = 0;
        if (foundSkills.length > 5) score += 30;
        if (foundSkills.length > 10) score += 20;
        if (technicalSkills.length > 3) score += 25;
        if (foundSkills.length > 15) score += 25;

        return {
            score: Math.min(score, 100),
            totalSkills: foundSkills.length,
            technicalSkills: technicalSkills.length,
            foundSkills: foundSkills.slice(0, 10) // Top 10 for display
        };
    }

    // Analyze education section
    analyzeEducation(text) {
        // Reset regex patterns to avoid global flag issues
        this.compiledPatterns.degreeMention.lastIndex = 0;
        this.compiledPatterns.institution.lastIndex = 0;
        this.compiledPatterns.graduation.lastIndex = 0;
        this.compiledPatterns.gpa.lastIndex = 0;
        
        const hasDegreeMention = this.compiledPatterns.degreeMention.test(text);
        const hasInstitution = this.compiledPatterns.institution.test(text);
        const hasGraduation = this.compiledPatterns.graduation.test(text);
        const hasGPA = this.compiledPatterns.gpa.test(text);

        let score = 0;
        if (hasDegreeMention) score += 40;
        if (hasInstitution) score += 30;
        if (hasGraduation) score += 20;
        if (hasGPA) score += 10;

        return {
            score: Math.min(score, 100),
            hasDegreeMention,
            hasInstitution,
            hasGraduation,
            hasGPA
        };
    }

    // Keyword analysis with job matching
    analyzeKeywords(resumeText, jobDescription = '') {
        // Extract keywords from resume
        const resumeKeywords = keywordExtractor.extract(resumeText, {
            language: 'english',
            remove_digits: false,
            return_changed_case: false,
            remove_duplicates: true
        });

        // Extract keywords from job description if provided
        const jobKeywords = jobDescription ? keywordExtractor.extract(jobDescription, {
            language: 'english',
            remove_digits: false,
            return_changed_case: false,
            remove_duplicates: true
        }) : [];

        // Find industry-relevant keywords
        const allIndustryKeywords = Object.values(this.industryKeywords).flat();
        const foundIndustryKeywords = allIndustryKeywords.filter(keyword =>
            resumeText.toLowerCase().includes(keyword.toLowerCase())
        );

        // Calculate keyword matching score
        const matchingKeywords = jobKeywords.filter(keyword =>
            resumeText.toLowerCase().includes(keyword.toLowerCase())
        );

        // Find missing important keywords
        const missingKeywords = jobKeywords.filter(keyword =>
            !resumeText.toLowerCase().includes(keyword.toLowerCase())
        ).slice(0, 10); // Top 10 missing

        return {
            resumeKeywords: resumeKeywords.slice(0, 20),
            jobKeywords: jobKeywords.slice(0, 20),
            industryKeywords: foundIndustryKeywords,
            matchingKeywords,
            missingKeywords,
            matchingScore: jobKeywords.length > 0 ? 
                (matchingKeywords.length / jobKeywords.length) * 100 : 50
        };
    }

    // ATS compatibility check
    checkATSCompatibility(text, filename) {
        const checks = {
            fileFormat: this.atsChecks.preferredFormats.includes(
                '.' + filename.toLowerCase().split('.').pop()
            ),
            hasContactInfo: /email|phone|@/.test(text),
            hasProperSections: 0,
            avoidProblematicContent: true,
            hasReadableFormat: true,
            length: text.split('\n').length
        };

        // Check for required sections
        Object.keys(this.sectionPatterns).forEach(section => {
            if (this.sectionPatterns[section].test(text.toLowerCase())) {
                checks.hasProperSections++;
            }
        });

        // Check for problematic content
        this.atsChecks.avoidWords.forEach(word => {
            if (text.toLowerCase().includes(word.toLowerCase())) {
                checks.avoidProblematicContent = false;
            }
        });

        // Calculate ATS score
        let score = 0;
        if (checks.fileFormat) score += 20;
        if (checks.hasContactInfo) score += 15;
        if (checks.hasProperSections >= 4) score += 25;
        if (checks.hasProperSections >= 6) score += 15;
        if (checks.avoidProblematicContent) score += 15;
        if (checks.length > 20 && checks.length < 200) score += 10;

        return {
            score: Math.min(score, 100),
            checks,
            recommendations: this.generateATSRecommendations(checks)
        };
    }

    // Generate ATS-specific recommendations
    generateATSRecommendations(checks) {
        const recommendations = [];

        if (!checks.fileFormat) {
            recommendations.push('Use PDF or DOCX format for better ATS compatibility');
        }
        if (!checks.hasContactInfo) {
            recommendations.push('Include clear contact information with email and phone');
        }
        if (checks.hasProperSections < 4) {
            recommendations.push('Add missing sections: Summary, Experience, Education, Skills');
        }
        if (!checks.avoidProblematicContent) {
            recommendations.push('Remove phrases like "references available upon request"');
        }
        if (checks.length < 20) {
            recommendations.push('Resume appears too short - add more detail to sections');
        }
        if (checks.length > 200) {
            recommendations.push('Resume may be too long - consider condensing content');
        }

        return recommendations;
    }

    // Analyze content quality
    analyzeContentQuality(text) {
        const wordCount = text.split(/\s+/).length;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
        const avgWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : 0;
        
        // Check for action words
        const actionWords = [
            'achieved', 'managed', 'led', 'developed', 'created', 'implemented',
            'designed', 'optimized', 'increased', 'decreased', 'improved'
        ];
        const actionWordCount = actionWords.filter(word => 
            text.toLowerCase().includes(word)
        ).length;

        // Check for quantified achievements
        const quantifiedAchievements = (text.match(/\d+%|\$\d+[\d,]*|\d+\+/g) || []).length;

        // Calculate quality score
        let score = 0;
        if (wordCount >= 200) score += 20;
        if (wordCount >= 400) score += 20;
        if (actionWordCount >= 5) score += 25;
        if (quantifiedAchievements >= 3) score += 25;
        if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) score += 10;

        return {
            score: Math.min(score, 100),
            wordCount,
            sentenceCount: sentences.length,
            avgWordsPerSentence: Math.round(avgWordsPerSentence),
            actionWordCount,
            quantifiedAchievements
        };
    }

    // Analyze formatting and structure
    analyzeFormat(text, filename) {
        const lines = text.split('\n');
        const nonEmptyLines = lines.filter(line => line.trim().length > 0);
        
        // Check for consistent formatting indicators
        const hasConsistentBullets = this.compiledPatterns.consistentBullets.test(text);
        const hasCapitalizedHeaders = this.compiledPatterns.capitalizedHeaders.test(text);
        const hasDateFormatting = this.compiledPatterns.dateFormatting.test(text);
        
        let score = 0;
        if (nonEmptyLines.length > 20) score += 25;
        if (hasConsistentBullets) score += 25;
        if (hasCapitalizedHeaders) score += 25;
        if (hasDateFormatting) score += 25;

        return {
            score: Math.min(score, 100),
            totalLines: lines.length,
            contentLines: nonEmptyLines.length,
            hasConsistentBullets,
            hasCapitalizedHeaders,
            hasDateFormatting
        };
    }

    // Sentiment analysis of resume content
    analyzeSentiment(text) {
        const result = this.sentiment.analyze(text);
        return {
            score: result.score,
            comparative: result.comparative,
            positive: result.positive,
            negative: result.negative,
            overall: result.score > 0 ? 'positive' : result.score < 0 ? 'negative' : 'neutral'
        };
    }

    // Readability analysis
    analyzeReadability(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
        const words = text.split(/\s+/);
        const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);
        
        // Flesch Reading Ease Score
        const avgSentenceLength = words.length / sentences.length;
        const avgSyllablesPerWord = syllables / words.length;
        const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);

        return {
            fleschScore: Math.max(0, Math.min(100, fleschScore)),
            avgSentenceLength: Math.round(avgSentenceLength),
            avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
            readabilityLevel: this.getReadabilityLevel(fleschScore)
        };
    }

    // Count syllables in a word (simple approximation)
    countSyllables(word) {
        word = word.toLowerCase();
        if (word.length <= 3) return 1;
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        word = word.replace(/^y/, '');
        const matches = word.match(/[aeiouy]{1,2}/g);
        return matches ? matches.length : 1;
    }

    // Get readability level description
    getReadabilityLevel(score) {
        if (score >= 90) return 'Very Easy';
        if (score >= 80) return 'Easy';
        if (score >= 70) return 'Fairly Easy';
        if (score >= 60) return 'Standard';
        if (score >= 50) return 'Fairly Difficult';
        if (score >= 30) return 'Difficult';
        return 'Very Difficult';
    }

    // Calculate overall scores
    calculateScores(analysis) {
        const weights = {
            ats: 0.25,
            content: 0.25,
            format: 0.20,
            keywords: 0.15,
            sections: 0.15
        };

        // Calculate section completeness score
        const sectionScore = Object.values(analysis.sections).reduce((total, section) => {
            return total + (section.present ? (section.strength || 50) : 0);
        }, 0) / Object.keys(analysis.sections).length;

        const scores = {
            ats: analysis.atsCompatibility.score,
            content: analysis.contentQuality.score,
            format: analysis.formatScore.score,
            keywords: analysis.keywords.matchingScore,
            sections: sectionScore,
            overall: 0
        };

        // Calculate weighted overall score
        scores.overall = Math.round(
            scores.ats * weights.ats +
            scores.content * weights.content +
            scores.format * weights.format +
            scores.keywords * weights.keywords +
            scores.sections * weights.sections
        );

        return scores;
    }

    // Generate improvement suggestions
    generateSuggestions(analysis) {
        const suggestions = [];

        // ATS-based suggestions
        if (analysis.scores.ats < 80) {
            suggestions.push({
                category: 'ATS Compatibility',
                priority: 'high',
                title: 'Improve ATS Compatibility',
                description: 'Your resume may not be easily readable by Applicant Tracking Systems',
                suggestions: analysis.atsCompatibility.recommendations
            });
        }

        // Content quality suggestions
        if (analysis.scores.content < 70) {
            const contentSuggestions = [];
            if (analysis.contentQuality.actionWordCount < 5) {
                contentSuggestions.push('Use more action verbs like "managed", "developed", "implemented"');
            }
            if (analysis.contentQuality.quantifiedAchievements < 3) {
                contentSuggestions.push('Add quantified achievements with numbers and percentages');
            }
            if (analysis.contentQuality.wordCount < 300) {
                contentSuggestions.push('Expand your resume with more detailed descriptions');
            }

            suggestions.push({
                category: 'Content Quality',
                priority: 'high',
                title: 'Enhance Content Quality',
                description: 'Your resume content could be more impactful',
                suggestions: contentSuggestions
            });
        }

        // Section-specific suggestions
        Object.keys(analysis.sections).forEach(sectionType => {
            const section = analysis.sections[sectionType];
            if (!section.present) {
                suggestions.push({
                    category: 'Missing Section',
                    priority: sectionType === 'experience' || sectionType === 'skills' ? 'high' : 'medium',
                    title: `Add ${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} Section`,
                    description: `Your resume is missing a ${sectionType} section`,
                    suggestions: [`Include a dedicated ${sectionType} section with relevant information`]
                });
            } else if (section.strength < 60) {
                suggestions.push({
                    category: 'Section Improvement',
                    priority: 'medium',
                    title: `Strengthen ${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} Section`,
                    description: `Your ${sectionType} section could be enhanced`,
                    suggestions: this.getSectionSpecificSuggestions(sectionType, section)
                });
            }
        });

        // Keyword suggestions
        if (analysis.keywords.missingKeywords.length > 0) {
            suggestions.push({
                category: 'Keywords',
                priority: 'medium',
                title: 'Add Relevant Keywords',
                description: 'Your resume is missing some important keywords',
                suggestions: [
                    `Consider adding these keywords: ${analysis.keywords.missingKeywords.slice(0, 5).join(', ')}`,
                    'Research job descriptions in your field for more relevant keywords'
                ]
            });
        }

        // Format suggestions
        if (analysis.scores.format < 70) {
            suggestions.push({
                category: 'Formatting',
                priority: 'low',
                title: 'Improve Formatting',
                description: 'Your resume formatting could be more consistent',
                suggestions: [
                    'Use consistent bullet points throughout',
                    'Ensure proper date formatting (MM/YYYY)',
                    'Use consistent capitalization for section headers'
                ]
            });
        }

        return suggestions.sort((a, b) => {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    // Get section-specific improvement suggestions
    getSectionSpecificSuggestions(sectionType, section) {
        const suggestions = [];

        switch (sectionType) {
            case 'experience':
                if (section.details && !section.details.hasQuantifiedAchievements) {
                    suggestions.push('Add quantified achievements with specific numbers and percentages');
                }
                if (section.details && !section.details.hasActionWords) {
                    suggestions.push('Start bullet points with strong action verbs');
                }
                if (section.details && section.details.companyCount === 0) {
                    suggestions.push('Include company names and job titles');
                }
                break;

            case 'skills':
                if (section.details && section.details.totalSkills < 8) {
                    suggestions.push('Add more relevant technical and soft skills');
                }
                if (section.details && section.details.technicalSkills < 3) {
                    suggestions.push('Include more technical skills relevant to your field');
                }
                break;

            case 'education':
                if (section.details && !section.details.hasDegreeMention) {
                    suggestions.push('Clearly mention your degree type and major');
                }
                if (section.details && !section.details.hasInstitution) {
                    suggestions.push('Include the name of your educational institution');
                }
                break;

            default:
                suggestions.push(`Provide more detailed information in your ${sectionType} section`);
        }

        return suggestions.length > 0 ? suggestions : [`Enhance your ${sectionType} section with more relevant details`];
    }
}

module.exports = ResumeAnalyzer;