const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { Parser } = require("json2csv");
const csv = require("csv-parser");
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://ajax.googleapis.com"],
            imgSrc: ["'self'", "data:", "https:", "https://cdn-icons-png.flaticon.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            frameSrc: ["'self'", "https://www.youtube.com"],
            connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://ajax.googleapis.com"]
        }
    }
}));

// Rate Limiting
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/login', loginLimiter);
app.use('/api/', generalLimiter);

// CORS Configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' ?
        ['https://yourdomain.com'] :
        ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Session Configuration
// SECURITY WARNING: Always set SESSION_SECRET environment variable in production!
app.use(session({
    secret: process.env.SESSION_SECRET || 'hiresight-secure-session-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost:27017/hiresight'
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Input Validation and Sanitization Functions
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return validator.escape(input.trim());
}

function validateEmail(email) {
    return validator.isEmail(email) && validator.isLength(email, { max: 254 });
}

function validatePassword(password) {
    return validator.isLength(password, { min: 8, max: 128 }) &&
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password);
}

function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).json({ error: 'Authentication required' });
}

function requireRole(roles) {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!roles.includes(req.session.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    try {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('✅ Created uploads directory');
    } catch (error) {
        console.error('❌ Failed to create uploads directory:', error);
        process.exit(1);
    }
}

// Enhanced MongoDB connection for Compass compatibility
const mongoConfig = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    bufferCommands: false, // Disable mongoose buffering
};

// MongoDB connection with enhanced error handling
const mongoUrl = process.env.MONGODB_URL || "mongodb://localhost:27017/hiresight";
mongoose.connect(mongoUrl, mongoConfig)
    .then(() => {
        if (process.env.NODE_ENV !== 'production') {
            console.log("✅ MongoDB connected successfully");
        }
    })
    .catch(err => {
        console.error("❌ MongoDB connection failed");
        if (process.env.NODE_ENV !== 'production') {
            console.error(err.message);
        }
        process.exit(1);
    });

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose disconnected from MongoDB');
});

// ========================= SCHEMAS =========================

// User Schema (for authentication)
const userSchema = new mongoose.Schema({
    role: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true }
}, { collection: "userdetail" });

// Enhanced Applicant Schema for HR Management
const applicantSchema = new mongoose.Schema({
    applicantId: { type: String, unique: true, required: true },
    name: String,
    email: String,
    phone: String,
    dateApplied: { type: Date, default: Date.now },
    position: String,
    department: String,
    experience: String,
    skills: [String],
    qualification: String,
    currentSalary: Number,
    expectedSalary: Number,
    location: String,
    resumeUrl: String,
    // Extended profile fields captured from CSV and UI
    linkedinProfile: String,
    currentPosition: String,
    currentCompany: String,
    workAuthorization: String,
    willingToRelocate: Boolean,
    availableStartDate: Date,
    noticePeriod: String,
    keyAchievements: String,
    coverLetterSummary: String,
    languageSkills: String,
    certifications: String,
    industryExperience: String,
    managementExperience: String,
    technicalProficiency: String,
    softSkills: String,
    referencesAvailable: Boolean,
    status: {
        type: String,
        enum: ['Applied', 'Under Review', 'Interview Scheduled', 'Selected', 'Rejected', 'Offer Extended', 'Hired'],
        default: 'Applied'
    },
    interviewDate: Date,
    interviewFeedback: String,
    hrNotes: String,
    assignedTo: String, // HR person assigned
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    source: String, // Job portal, referral, etc.
    lastUpdated: { type: Date, default: Date.now },
    adminApproved: { type: Boolean, default: false },
    sentToHR: { type: Boolean, default: false },
    hrProcessed: { type: Boolean, default: false }
}, { collection: "applicants" });

// Comprehensive Hiring Data Schema for Admin
const hiringSchema = new mongoose.Schema({
    Department: String,
    Position: String,
    Location: String,
    JobDescription: String,
    Requirements: String,
    SalaryRange: String,
    SalaryCurrency: String,
    JobType: String, // Full-time, Part-time, Contract
    ExperienceLevel: String,
    PostedDate: { type: Date, default: Date.now },
    ApplicationDeadline: Date,
    Total: Number,
    Selected: Number,
    Rejected: Number,
    Pending: Number,
    Interviewed: Number,
    OfferExtended: Number,
    Hired: Number,
    Budget: Number,
    Priority: String,
    HiringManager: String,
    Status: { type: String, enum: ['Open', 'On Hold', 'Closed', 'Draft'], default: 'Open' },
    hrAssigned: [String], // Array of HR personnel assigned
    adminNotes: String,
    lastUpdated: { type: Date, default: Date.now }
}, { collection: "hiring" });

// Enhanced User Management Schema
const userManagementSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
        type: String,
        required: true,
        enum: ['User', 'Admin', 'HR'],
        default: 'User'
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Suspended', 'Pending'],
        default: 'Active'
    },
    department: String,
    joinDate: { type: Date, default: Date.now },
    permissions: [String],
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    createdBy: String, // Track who created this user
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { collection: "usermanagement" });

// Resume Schema
const resumeSchema = new mongoose.Schema({
    fileName: String,
    textContent: String,
    csvContent: String,
    uploadedAt: { type: Date, default: Date.now },
    // Enhanced schema to support comprehensive resume analysis
    analysisData: {
        scores: mongoose.Schema.Types.Mixed,
        sections: mongoose.Schema.Types.Mixed,
        keywords: mongoose.Schema.Types.Mixed,
        atsCompatibility: mongoose.Schema.Types.Mixed,
        contentQuality: mongoose.Schema.Types.Mixed,
        formatScore: mongoose.Schema.Types.Mixed,
        suggestions: mongoose.Schema.Types.Mixed,
        sentiment: mongoose.Schema.Types.Mixed,
        readability: mongoose.Schema.Types.Mixed,
        analysisTimestamp: Date
    }
});

// Admin to HR Data Transfer Schema
const adminHRTransferSchema = new mongoose.Schema({
    transferId: { type: String, unique: true, required: true },
    fromAdmin: String,
    toHR: [String], // Array of HR personnel
    transferType: { type: String, enum: ['Job Posting', 'Applicant Data', 'Mixed'], required: true },
    jobPostings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hiring' }],
    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Applicant' }],
    message: String,
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    status: { type: String, enum: ['Pending', 'Accepted', 'In Progress', 'Completed'], default: 'Pending' },
    transferDate: { type: Date, default: Date.now },
    processedDate: Date,
    hrFeedback: String
}, { collection: "adminHRTransfers" });

// Analytics Schema for comprehensive reporting
const analyticsSchema = new mongoose.Schema({
    type: { type: String, enum: ['Daily', 'Weekly', 'Monthly', 'Yearly'], required: true },
    date: { type: Date, required: true },
    metrics: {
        applicationsReceived: { type: Number, default: 0 },
        applicationsProcessed: { type: Number, default: 0 },
        interviewsConducted: { type: Number, default: 0 },
        offersExtended: { type: Number, default: 0 },
        hiresCompleted: { type: Number, default: 0 },
        averageTimeToHire: { type: Number, default: 0 },
        costPerHire: { type: Number, default: 0 }
    },
    departmentWise: [{
        department: String,
        applicationsReceived: Number,
        hired: Number,
        avgTimeToHire: Number
    }],
    sourceWise: [{
        source: String,
        applications: Number,
        conversionRate: Number
    }],
    createdAt: { type: Date, default: Date.now }
}, { collection: "analytics" });

// ========================= MODELS =========================
const User = mongoose.model("User", userSchema);
const Applicant = mongoose.model("Applicant", applicantSchema);
const Hiring = mongoose.model("Hiring", hiringSchema);
const UserManagement = mongoose.model("UserManagement", userManagementSchema);
const Resume = mongoose.model("Resume", resumeSchema);
const AdminHRTransfer = mongoose.model("AdminHRTransfer", adminHRTransferSchema);
const Analytics = mongoose.model("Analytics", analyticsSchema);

// ========================= MULTER SETUP =========================
const upload = multer({
    dest: "uploads/",
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1
    },
    fileFilter: (req, file, cb) => {
        // Allowed MIME types
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/csv'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and CSV files are allowed.'), false);
        }
    }
});

// ========================= API ROUTES =========================

// Root route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ==================== AUTHENTICATION ROUTES ====================

// Enhanced Login API with UserManagement integration
app.post("/api/login", async (req, res) => {
    let { email, password, role } = req.body;

    try {
        // Input validation and sanitization
        if (!email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Email, password, and role are required"
            });
        }

        // Sanitize inputs
        email = sanitizeInput(email);
        role = sanitizeInput(role);

        // Validate email format
        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        // Validate role
        const validRoles = ['User', 'Admin', 'HR'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role specified"
            });
        }

        // Find user in UserManagement collection
        const user = await UserManagement.findOne({
            email: email.toLowerCase(),
            role: role
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials or user not found"
            });
        }

        // Check if user account is locked
        if (user.lockUntil && user.lockUntil > Date.now()) {
            return res.status(423).json({
                success: false,
                message: "Account temporarily locked due to multiple failed login attempts"
            });
        }

        // Check if user account is active
        if (user.status !== 'Active') {
            return res.status(403).json({
                success: false,
                message: `Account is ${user.status.toLowerCase()}. Please contact administrator.`
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            // Increment login attempts
            const loginAttempts = user.loginAttempts + 1;
            const updateData = { loginAttempts };

            // Lock account after 5 failed attempts for 30 minutes
            if (loginAttempts >= 5) {
                updateData.lockUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
            }

            await UserManagement.findByIdAndUpdate(user._id, updateData);

            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
                attemptsRemaining: Math.max(0, 5 - loginAttempts)
            });
        }

        // Reset login attempts and update last login on successful login
        await UserManagement.findByIdAndUpdate(user._id, {
            loginAttempts: 0,
            lockUntil: null,
            lastLogin: new Date()
        });

        // Also sync with User collection for backward compatibility
        await User.findOneAndUpdate(
            { email: user.email },
            {
                email: user.email,
                name: user.name,
                role: user.role,
                password: user.password
            },
            { upsert: true }
        );

        // Create secure session
        req.session.user = {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            department: user.department
        };

        if (process.env.NODE_ENV !== 'production') {
            console.log(`✅ User ${user.email} logged in successfully as ${user.role}`);
        }

        res.json({
            success: true,
            role: user.role,
            name: user.name,
            email: user.email,
            department: user.department,
            lastLogin: user.lastLogin
        });
    } catch (err) {
        console.error("❌ Login error:", err);
        res.status(500).json({
            success: false,
            message: "Server error during authentication"
        });
    }
});

// Secure logout endpoint
app.post("/api/logout", isAuthenticated, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Logout failed" });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: "Logged out successfully" });
    });
});

// Enhanced Register API with UserManagement integration and role restrictions
app.post("/api/register", async (req, res) => {
    try {
        let { role, name, email, password, adminToken } = req.body;

        // Input validation and sanitization
        if (!role || !name || !email || !password) {
            return res.status(400).json({
                error: "All fields (role, name, email, password) are required"
            });
        }

        // Sanitize inputs
        role = sanitizeInput(role);
        name = sanitizeInput(name);
        email = sanitizeInput(email);
        if (adminToken) adminToken = sanitizeInput(adminToken);

        // Email validation
        if (!validateEmail(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        // Strong password validation
        if (!validatePassword(password)) {
            return res.status(400).json({
                error: "Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character"
            });
        }

        // Role-based registration restrictions
        const restrictedRoles = ['Admin', 'HR'];
        if (restrictedRoles.includes(role)) {
            // Only admin can create these roles
            if (!adminToken) {
                return res.status(403).json({
                    error: "Admin authorization required to create Admin or HR accounts"
                });
            }

            // Verify admin token (in a real app, this would be a JWT or session)
            // For now, we'll check if there's an active admin session or verify admin credentials
            const adminUser = await UserManagement.findOne({
                role: 'Admin',
                status: 'Active'
            });

            if (!adminUser) {
                return res.status(403).json({
                    error: "No active admin found to authorize this registration"
                });
            }
        }

        // Check duplicate email in UserManagement
        const existing = await UserManagement.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user in UserManagement
        const newUser = new UserManagement({
            role,
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            status: restrictedRoles.includes(role) ? 'Active' : 'Active', // All users start active
            department: req.body.department || null,
            createdBy: adminToken ? 'Admin' : 'Self-Registration'
        });

        await newUser.save();

        // Also create in User collection for backward compatibility
        const legacyUser = new User({
            role,
            name,
            email: email.toLowerCase(),
            password: hashedPassword
        });
        await legacyUser.save();

        console.log(`✅ New user registered: ${email} as ${role}`);

        res.json({
            message: "Registration successful",
            user: {
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                status: newUser.status
            }
        });
    } catch (err) {
        console.error("❌ Registration error:", err);

        // Handle duplicate key error
        if (err.code === 11000) {
            return res.status(400).json({ error: "Email already registered" });
        }

        res.status(500).json({ error: "Server error during registration", details: err.message });
    }
});

// ==================== APPLICANT DASHBOARD ROUTES ====================
app.get("/api/applicant/applications", async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ error: "Email is required to fetch applications" });
        }

        // Find all applications linked to this email
        const applications = await Applicant.find({ email: email.toLowerCase() })
            .sort({ dateApplied: -1 });

        res.json(applications);
    } catch (err) {
        console.error("❌ Error fetching applicant applications:", err);
        res.status(500).json({ error: "Failed to fetch applications" });
    }
});

// ==================== APPLICANT/HR KANBAN ROUTES ====================
app.patch("/api/applicants/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: "Status is required" });
        }

        const validStatuses = ['Applied', 'Under Review', 'Interview Scheduled', 'Selected', 'Rejected', 'Offer Extended', 'Hired'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status value" });
        }

        // Find and update the applicant
        const applicant = await Applicant.findById(id);

        // Support fallback to applicantId if full Mongo _id fails in legacy data
        const applicantToUpdate = applicant || await Applicant.findOne({ applicantId: id });

        if (!applicantToUpdate) {
            return res.status(404).json({ error: "Applicant not found" });
        }

        const oldStatus = applicantToUpdate.status;
        applicantToUpdate.status = status;
        applicantToUpdate.lastUpdated = new Date();

        await applicantToUpdate.save();

        // Simulated Email Notification
        console.log(`\n========================================`);
        console.log(`📧 SIMULATED EMAIL NOTIFICATION SENT`);
        console.log(`To: ${applicantToUpdate.email}`);
        console.log(`Subject: Application Status Update - ${applicantToUpdate.position}`);
        console.log(`Message: Hi ${applicantToUpdate.name},\nYour application status has been updated from '${oldStatus}' to '${status}'.`);
        console.log(`========================================\n`);

        res.json({ success: true, applicant: applicantToUpdate });
    } catch (err) {
        console.error("❌ Error updating applicant status:", err);
        res.status(500).json({ error: "Failed to update status" });
    }
});

// ==================== HIRING MANAGEMENT ROUTES ====================

// Get all hiring data
app.get("/api/hiring", async (req, res) => {
    try {
        const data = await Hiring.find();
        res.json(data);
    } catch (err) {
        console.error("❌ Error fetching hiring data:", err);
        res.status(500).json({ message: err.message });
    }
});

// Get uploaded CSV data for admin dashboard
app.get("/api/admin/csv-data", async (req, res) => {
    try {
        // Get recent hiring data uploaded via CSV
        const csvData = await Hiring.find({
            source: 'CSV Import - Applicant Data'
        }).sort({ csvUploadDate: -1 }).limit(10);

        // Get corresponding applicants for these jobs
        const applicantsData = await Applicant.find({
            source: 'CSV Import'
        }).sort({ dateApplied: -1 }).limit(100);

        res.json({
            csvJobs: csvData,
            csvApplicants: applicantsData,
            summary: {
                totalJobs: csvData.length,
                totalApplicants: applicantsData.length,
                lastUploadDate: csvData.length > 0 ? csvData[0].csvUploadDate : null
            }
        });
    } catch (err) {
        console.error("❌ Error fetching CSV data:", err);
        res.status(500).json({ message: err.message });
    }
});

// Get LinkedIn job postings with applicant details
app.get("/api/admin/linkedin-jobs", async (req, res) => {
    try {
        const linkedinJobs = await Hiring.find({
            source: 'LinkedIn CSV Import',
            isLinkedInJob: true
        }).sort({ csvUploadDate: -1 });

        const jobsWithApplicants = await Promise.all(
            linkedinJobs.map(async (job) => {
                const applicants = await Applicant.find({
                    position: job.Position,
                    department: job.Department,
                    source: 'LinkedIn'
                }).sort({ dateApplied: -1 });

                return {
                    ...job.toObject(),
                    applicantsList: applicants,
                    actualApplicantCount: applicants.length
                };
            })
        );

        res.json({
            linkedinJobs: jobsWithApplicants,
            totalJobs: linkedinJobs.length,
            summary: {
                totalApplicants: jobsWithApplicants.reduce((sum, job) => sum + job.actualApplicantCount, 0),
                lastUploadDate: linkedinJobs.length > 0 ? linkedinJobs[0].csvUploadDate : null
            }
        });
    } catch (err) {
        console.error("❌ Error fetching LinkedIn jobs:", err);
        res.status(500).json({ message: err.message });
    }
});

// Get specific LinkedIn job with all applicants
app.get("/api/admin/linkedin-jobs/:jobId", async (req, res) => {
    try {
        const jobId = req.params.jobId;
        const job = await Hiring.findById(jobId);

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        const applicants = await Applicant.find({
            position: job.Position,
            department: job.Department,
            source: 'LinkedIn'
        }).sort({ dateApplied: -1 });

        // Get status distribution
        const statusDistribution = {};
        applicants.forEach(applicant => {
            statusDistribution[applicant.status] = (statusDistribution[applicant.status] || 0) + 1;
        });

        res.json({
            job: job,
            applicants: applicants,
            statistics: {
                totalApplicants: applicants.length,
                statusDistribution,
                highPriorityCount: applicants.filter(a => a.priority === 'High').length,
                averageExpectedSalary: applicants.reduce((sum, a) => sum + (a.expectedSalary || 0), 0) / applicants.length || 0
            }
        });
    } catch (err) {
        console.error("❌ Error fetching LinkedIn job details:", err);
        res.status(500).json({ message: err.message });
    }
});

// Get CSV data by specific job/department
app.get("/api/admin/csv-data/:department", async (req, res) => {
    try {
        const department = req.params.department;

        // Get hiring data for specific department
        const jobData = await Hiring.findOne({
            Department: department,
            source: 'CSV Import - Applicant Data'
        }).sort({ csvUploadDate: -1 });

        if (!jobData) {
            return res.status(404).json({ message: "No CSV data found for this department" });
        }

        // Get applicants for this department
        const applicants = await Applicant.find({
            department: department,
            source: 'CSV Import'
        }).sort({ dateApplied: -1 });

        res.json({
            jobDetails: jobData,
            applicants: applicants,
            summary: {
                department: department,
                totalApplicants: applicants.length,
                statusBreakdown: {
                    Applied: applicants.filter(a => a.status === 'Applied').length,
                    'Under Review': applicants.filter(a => a.status === 'Under Review').length,
                    'Interview Scheduled': applicants.filter(a => a.status === 'Interview Scheduled').length,
                    Selected: applicants.filter(a => a.status === 'Selected').length,
                    Rejected: applicants.filter(a => a.status === 'Rejected').length,
                    Hired: applicants.filter(a => a.status === 'Hired').length
                }
            }
        });
    } catch (err) {
        console.error("❌ Error fetching department CSV data:", err);
        res.status(500).json({ message: err.message });
    }
});

// Get hiring stats
app.get("/api/hiring/stats", async (req, res) => {
    try {
        const stats = await Hiring.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: "$Total" },
                    selected: { $sum: "$Selected" },
                    rejected: { $sum: "$Rejected" },
                    pending: { $sum: "$Pending" },
                }
            }
        ]);
        res.json(stats[0] || { total: 0, selected: 0, rejected: 0, pending: 0 });
    } catch (err) {
        console.error("❌ Error fetching hiring stats:", err);
        res.status(500).json({ message: err.message });
    }
});

// Get monthly hiring trends
app.get("/api/hiring/trends/monthly", async (req, res) => {
    try {
        const trends = await Hiring.aggregate([
            {
                $group: {
                    _id: { $month: "$PostedDate" },
                    hires: { $sum: "$Hired" }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        res.json(trends);
    } catch (err) {
        console.error("❌ Error fetching monthly trends:", err);
        res.status(500).json({ message: err.message });
    }
});

// Get hires by experience level
app.get("/api/hiring/experience", async (req, res) => {
    try {
        const experience = await Hiring.aggregate([
            {
                $group: {
                    _id: "$ExperienceLevel",
                    hires: { $sum: "$Hired" }
                }
            }
        ]);
        res.json(experience);
    } catch (err) {
        console.error("❌ Error fetching experience data:", err);
        res.status(500).json({ message: err.message });
    }
});

// ==================== ENHANCED ADMIN DASHBOARD APIS ====================

// Get comprehensive dashboard statistics
app.get("/api/admin/dashboard/stats", async (req, res) => {
    try {
        const [hiringStats, applicantStats, userStats, recentActivities] = await Promise.all([
            // Hiring statistics
            Hiring.aggregate([
                {
                    $group: {
                        _id: null,
                        totalJobs: { $sum: 1 },
                        openJobs: { $sum: { $cond: [{ $eq: ["$Status", "Open"] }, 1, 0] } },
                        closedJobs: { $sum: { $cond: [{ $eq: ["$Status", "Closed"] }, 1, 0] } },
                        onHoldJobs: { $sum: { $cond: [{ $eq: ["$Status", "On Hold"] }, 1, 0] } },
                        totalBudget: { $sum: "$Budget" },
                        totalApplications: { $sum: "$Total" },
                        totalHired: { $sum: "$Hired" },
                        totalInterviewed: { $sum: "$Interviewed" }
                    }
                }
            ]),
            // Applicant statistics
            Applicant.aggregate([
                {
                    $group: {
                        _id: null,
                        totalApplicants: { $sum: 1 },
                        applied: { $sum: { $cond: [{ $eq: ["$status", "Applied"] }, 1, 0] } },
                        underReview: { $sum: { $cond: [{ $eq: ["$status", "Under Review"] }, 1, 0] } },
                        interviewed: { $sum: { $cond: [{ $eq: ["$status", "Interview Scheduled"] }, 1, 0] } },
                        selected: { $sum: { $cond: [{ $eq: ["$status", "Selected"] }, 1, 0] } },
                        rejected: { $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] } },
                        hired: { $sum: { $cond: [{ $eq: ["$status", "Hired"] }, 1, 0] } }
                    }
                }
            ]),
            // User statistics
            UserManagement.aggregate([
                {
                    $group: {
                        _id: null,
                        totalUsers: { $sum: 1 },
                        activeUsers: { $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] } },
                        hrUsers: { $sum: { $cond: [{ $regex: ["$role", "HR", "i"] }, 1, 0] } }
                    }
                }
            ]),
            // Recent activities (last 10)
            Applicant.find().sort({ lastUpdated: -1 }).limit(10).select('name position status lastUpdated')
        ]);

        res.json({
            hiring: hiringStats[0] || {},
            applicants: applicantStats[0] || {},
            users: userStats[0] || {},
            recentActivities
        });
    } catch (err) {
        console.error("❌ Error fetching admin dashboard stats:", err);
        res.status(500).json({ message: err.message });
    }
});

// Get department-wise hiring analytics
app.get("/api/admin/analytics/departments", async (req, res) => {
    try {
        const departmentAnalytics = await Hiring.aggregate([
            {
                $group: {
                    _id: "$Department",
                    totalJobs: { $sum: 1 },
                    totalApplications: { $sum: "$Total" },
                    totalHired: { $sum: "$Hired" },
                    totalBudget: { $sum: "$Budget" },
                    avgTimeToHire: { $avg: "$Hired" }, // This would need to be calculated properly
                    openPositions: { $sum: { $cond: [{ $eq: ["$Status", "Open"] }, 1, 0] } }
                }
            },
            {
                $addFields: {
                    hiringRate: { $divide: ["$totalHired", "$totalApplications"] },
                    avgBudgetPerHire: { $divide: ["$totalBudget", { $max: ["$totalHired", 1] }] }
                }
            }
        ]);

        res.json(departmentAnalytics);
    } catch (err) {
        console.error("❌ Error fetching department analytics:", err);
        res.status(500).json({ message: err.message });
    }
});

// Get hiring trends over time
app.get("/api/admin/analytics/trends", async (req, res) => {
    try {
        const { period = 'monthly' } = req.query;

        let groupBy;
        switch (period) {
            case 'daily':
                groupBy = { year: { $year: "$PostedDate" }, month: { $month: "$PostedDate" }, day: { $dayOfMonth: "$PostedDate" } };
                break;
            case 'weekly':
                groupBy = { year: { $year: "$PostedDate" }, week: { $week: "$PostedDate" } };
                break;
            case 'yearly':
                groupBy = { year: { $year: "$PostedDate" } };
                break;
            default: // monthly
                groupBy = { year: { $year: "$PostedDate" }, month: { $month: "$PostedDate" } };
        }

        const trends = await Hiring.aggregate([
            {
                $group: {
                    _id: groupBy,
                    jobsPosted: { $sum: 1 },
                    totalApplications: { $sum: "$Total" },
                    totalHired: { $sum: "$Hired" },
                    totalBudget: { $sum: "$Budget" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1, "_id.day": 1 } }
        ]);

        res.json(trends);
    } catch (err) {
        console.error("❌ Error fetching hiring trends:", err);
        res.status(500).json({ message: err.message });
    }
});

// Get applicant source analytics
app.get("/api/admin/analytics/sources", async (req, res) => {
    try {
        const sourceAnalytics = await Applicant.aggregate([
            {
                $group: {
                    _id: "$source",
                    totalApplications: { $sum: 1 },
                    hired: { $sum: { $cond: [{ $eq: ["$status", "Hired"] }, 1, 0] } },
                    selected: { $sum: { $cond: [{ $eq: ["$status", "Selected"] }, 1, 0] } },
                    rejected: { $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] } }
                }
            },
            {
                $addFields: {
                    conversionRate: { $divide: ["$hired", "$totalApplications"] },
                    selectionRate: { $divide: ["$selected", "$totalApplications"] }
                }
            },
            { $sort: { totalApplications: -1 } }
        ]);

        res.json(sourceAnalytics);
    } catch (err) {
        console.error("❌ Error fetching source analytics:", err);
        res.status(500).json({ message: err.message });
    }
});

// Get real-time hiring pipeline status
app.get("/api/admin/pipeline/status", async (req, res) => {
    try {
        const pipeline = await Applicant.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    avgSalary: { $avg: "$expectedSalary" },
                    applications: {
                        $push: {
                            name: "$name",
                            position: "$position",
                            experience: "$experience",
                            priority: "$priority",
                            dateApplied: "$dateApplied"
                        }
                    }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Calculate pipeline flow rates
        const totalApplicants = await Applicant.countDocuments();
        const flowRates = pipeline.map(stage => ({
            ...stage,
            percentage: ((stage.count / totalApplicants) * 100).toFixed(2)
        }));

        res.json({
            pipeline: flowRates,
            total: totalApplicants,
            summary: {
                activeApplications: await Applicant.countDocuments({
                    status: { $in: ['Applied', 'Under Review', 'Interview Scheduled'] }
                }),
                completedProcesses: await Applicant.countDocuments({
                    status: { $in: ['Selected', 'Hired', 'Rejected'] }
                })
            }
        });
    } catch (err) {
        console.error("❌ Error fetching pipeline status:", err);
        res.status(500).json({ message: err.message });
    }
});

// Generate comprehensive hiring report
app.get("/api/admin/reports/comprehensive", async (req, res) => {
    try {
        const { startDate, endDate, department } = req.query;

        let matchStage = {};
        if (startDate && endDate) {
            matchStage.PostedDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        if (department) {
            matchStage.Department = department;
        }

        const report = await Hiring.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalJobs: { $sum: 1 },
                    totalBudget: { $sum: "$Budget" },
                    totalApplications: { $sum: "$Total" },
                    totalHired: { $sum: "$Hired" },
                    totalRejected: { $sum: "$Rejected" },
                    totalPending: { $sum: "$Pending" },
                    avgApplicationsPerJob: { $avg: "$Total" },
                    avgHireRate: { $avg: { $divide: ["$Hired", "$Total"] } },
                    avgBudgetPerJob: { $avg: "$Budget" }
                }
            }
        ]);

        // Get department breakdown if no specific department requested
        let departmentBreakdown = [];
        if (!department) {
            departmentBreakdown = await Hiring.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: "$Department",
                        jobs: { $sum: 1 },
                        applications: { $sum: "$Total" },
                        hired: { $sum: "$Hired" },
                        budget: { $sum: "$Budget" }
                    }
                }
            ]);
        }

        res.json({
            summary: report[0] || {},
            departmentBreakdown,
            generatedAt: new Date(),
            filters: { startDate, endDate, department }
        });
    } catch (err) {
        console.error("❌ Error generating comprehensive report:", err);
        res.status(500).json({ message: err.message });
    }
});



// Enhanced LinkedIn Job Applicants CSV upload
app.post("/api/adminupload", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    // Get job details from form data
    const jobTitle = req.body.jobTitle || 'Unknown Position';
    const jobDepartment = req.body.jobDepartment || 'General';
    const jobLocation = req.body.jobLocation || 'Remote';
    const jobDescription = req.body.jobDescription || '';
    const salaryCurrency = req.body.salaryCurrency || 'USD';
    const salaryRange = req.body.salaryRange || 'TBD';
    const jobType = req.body.jobType || 'Full-time';
    const experienceLevel = req.body.experienceLevel || 'Mid-level';
    const hiringManager = req.body.hiringManager || 'Admin';

    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (data) => {
            results.push(data);
        })
        .on("end", async () => {
            try {
                console.log('Processing LinkedIn job applicants CSV...');
                console.log('Job Details:', {
                    title: jobTitle,
                    department: jobDepartment,
                    location: jobLocation,
                    applicants: results.length
                });

                const applicantData = [];
                let statusCounts = {
                    Applied: 0,
                    'Under Review': 0,
                    'Interview Scheduled': 0,
                    Selected: 0,
                    Rejected: 0,
                    'Offer Extended': 0,
                    Hired: 0
                };

                // Process LinkedIn applicant data
                results.forEach((row, index) => {
                    try {
                        // Handle LinkedIn CSV format with comprehensive mapping
                        const applicantRecord = {
                            applicantId: row.ApplicantId || row.applicantId || `LI_${jobTitle.replace(/\s+/g, '_')}_${Date.now()}_${index}`,
                            name: row.Name || row.name || 'Unknown Applicant',
                            email: row.Email || row.email || '',
                            phone: row.Phone || row.phone || row['Phone Number'] || '',
                            position: jobTitle, // Use job title from form
                            department: jobDepartment, // Use department from form
                            experience: row['Total Experience'] || row.experience || row['Years of Experience'] || 'Not specified',
                            skills: parseSkills(row.Skills || row.skills || row['Technical Skills'] || ''),
                            qualification: row.Education || row.education || row.degree || row.qualification || '',
                            currentSalary: parseNumber(row['Current Salary'] || row.currentSalary || 0),
                            expectedSalary: parseNumber(row['Expected Salary'] || row.expectedSalary || 0),
                            location: row.Location || row.location || row.city || '',
                            status: determineInitialStatus(row),
                            source: 'LinkedIn',
                            priority: determinePriority(row),
                            dateApplied: parseDate(row['Application Date'] || row.applicationDate) || new Date(),
                            resumeUrl: row['Resume'] || row.resume || '',
                            linkedinProfile: row['LinkedIn Profile'] || row.linkedinProfile || '',
                            currentPosition: row['Current Position'] || row.currentPosition || '',
                            currentCompany: row['Current Company'] || row.currentCompany || '',
                            workAuthorization: row['Work Authorization'] || row.workAuthorization || '',
                            willingToRelocate: parseBoolean(row['Willing to Relocate'] || row.willingToRelocate),
                            availableStartDate: parseDate(row['Available Start Date'] || row.availableStartDate),
                            noticePeriod: row['Notice Period'] || row.noticePeriod || '',
                            keyAchievements: row['Key Achievements'] || row.keyAchievements || '',
                            coverLetterSummary: row['Cover Letter Summary'] || row.coverLetterSummary || '',
                            languageSkills: row['Language Skills'] || row.languageSkills || '',
                            certifications: row.Certifications || row.certifications || '',
                            industryExperience: row['Industry Experience'] || row.industryExperience || '',
                            managementExperience: row['Management Experience'] || row.managementExperience || 'No',
                            technicalProficiency: row['Technical Proficiency'] || row.technicalProficiency || 'Intermediate',
                            softSkills: row['Soft Skills'] || row.softSkills || '',
                            reasonForJobChange: row['Reason for Job Change'] || row.reasonForJobChange || '',
                            referencesAvailable: parseBoolean(row['References Available'] || row.referencesAvailable),
                            lastUpdated: new Date(),
                            adminApproved: false,
                            sentToHR: false,
                            hrProcessed: false
                        };

                        applicantData.push(applicantRecord);

                        // Count status distribution
                        if (statusCounts[applicantRecord.status] !== undefined) {
                            statusCounts[applicantRecord.status]++;
                        }

                    } catch (rowError) {
                        console.error(`Error processing row ${index}:`, rowError);
                    }
                });

                // Helper functions for data parsing
                function parseSkills(skillsString) {
                    if (!skillsString) return [];
                    return skillsString.split(/[,;]/).map(skill => skill.trim()).filter(skill => skill.length > 0);
                }

                function parseNumber(value) {
                    if (!value) return 0;
                    const num = parseInt(value.toString().replace(/[^0-9]/g, ''));
                    return isNaN(num) ? 0 : num;
                }

                function parseDate(dateString) {
                    if (!dateString) return null;
                    const date = new Date(dateString);
                    return isNaN(date.getTime()) ? null : date;
                }

                function parseBoolean(value) {
                    if (!value) return false;
                    return ['yes', 'true', '1', 'y'].includes(value.toString().toLowerCase());
                }

                function determineInitialStatus(row) {
                    // Logic to determine initial status based on data quality
                    const hasEmail = !!(row.Email || row.email);
                    const hasExperience = !!(row['Total Experience'] || row.experience);
                    const hasSkills = !!(row.Skills || row.skills);

                    if (hasEmail && hasExperience && hasSkills) {
                        return 'Applied';
                    } else {
                        return 'Under Review';
                    }
                }

                function determinePriority(row) {
                    const experience = row['Total Experience'] || row.experience || '';
                    const education = row.Education || row.education || '';

                    if (education.toLowerCase().includes('phd') || education.toLowerCase().includes('master')) {
                        return 'High';
                    } else if (experience.includes('5+') || experience.includes('senior')) {
                        return 'High';
                    } else if (experience.includes('3+') || experience.includes('mid')) {
                        return 'Medium';
                    } else {
                        return 'Low';
                    }
                }

                // Create the job posting based on form data and applicants
                const jobPosting = {
                    Department: jobDepartment,
                    Position: jobTitle,
                    Location: jobLocation,
                    JobDescription: jobDescription || `${jobTitle} position in ${jobDepartment} department`,
                    Requirements: 'As per LinkedIn job posting requirements',
                    SalaryRange: salaryRange,
                    SalaryCurrency: salaryCurrency,
                    JobType: jobType,
                    ExperienceLevel: experienceLevel,
                    Total: applicantData.length,
                    Selected: statusCounts.Selected || 0,
                    Rejected: statusCounts.Rejected || 0,
                    Pending: statusCounts.Applied + statusCounts['Under Review'],
                    Interviewed: statusCounts['Interview Scheduled'] || 0,
                    OfferExtended: statusCounts['Offer Extended'] || 0,
                    Hired: statusCounts.Hired || 0,
                    Budget: 0, // Set by admin later
                    Priority: determinePriorityFromApplicants(applicantData),
                    HiringManager: hiringManager,
                    Status: 'Open',
                    adminNotes: `LinkedIn CSV upload: ${applicantData.length} applicants for ${jobTitle}`,
                    source: 'LinkedIn CSV Import',
                    csvUploadDate: new Date(),
                    isLinkedInJob: true,
                    csvMetadata: {
                        uploadTimestamp: new Date(),
                        applicantCount: applicantData.length,
                        uploadType: 'LinkedIn Job Application',
                        fileName: req.file.filename,
                        statusBreakdown: statusCounts
                    },
                    lastUpdated: new Date()
                };

                function determinePriorityFromApplicants(applicants) {
                    const highPriorityCount = applicants.filter(a => a.priority === 'High').length;
                    const totalApplicants = applicants.length;

                    if (highPriorityCount / totalApplicants > 0.3) {
                        return 'High';
                    } else if (totalApplicants > 50) {
                        return 'High';
                    } else if (totalApplicants > 20) {
                        return 'Medium';
                    } else {
                        return 'Low';
                    }
                }

                // Save data to respective collections
                const promises = [];
                let summary = { imported: 0, errors: 0, details: {}, jobId: null };

                // Save job posting first
                promises.push(
                    new Hiring(jobPosting).save()
                        .then(result => {
                            summary.jobId = result._id;
                            summary.details.jobPosting = `Job posting created: ${jobTitle}`;
                            summary.imported += 1;
                            console.log('✅ Job posting created:', result._id);
                            return result;
                        })
                        .catch(err => {
                            console.error('❌ Error creating job posting:', err);
                            summary.errors++;
                            summary.details.jobError = err.message;
                        })
                );

                // Save applicants
                if (applicantData.length > 0) {
                    promises.push(
                        Applicant.insertMany(applicantData, { ordered: false })
                            .then(result => {
                                summary.details.applicants = `${result.length} applicants imported`;
                                summary.imported += result.length;
                                console.log(`✅ ${result.length} applicants imported`);
                                return result;
                            })
                            .catch(err => {
                                console.error('❌ Error importing applicant data:', err);
                                summary.errors++;
                                summary.details.applicantError = err.message;
                            })
                    );
                }

                await Promise.allSettled(promises);

                fs.unlinkSync(req.file.path);

                res.status(201).json({
                    message: "LinkedIn job applicants CSV processed successfully",
                    jobDetails: {
                        jobTitle: jobTitle,
                        department: jobDepartment,
                        location: jobLocation,
                        totalApplicants: applicantData.length,
                        jobId: summary.jobId
                    },
                    summary: summary,
                    statusBreakdown: statusCounts,
                    dataImported: {
                        jobPosting: 1,
                        applicants: applicantData.length
                    },
                    success: summary.errors === 0
                });

            } catch (err) {
                console.error("❌ Error processing CSV data:", err);
                fs.unlinkSync(req.file.path);
                res.status(500).json({ error: "Error processing CSV data", details: err.message });
            }
        })
        .on("error", (err) => {
            console.error("❌ CSV parsing error:", err);
            fs.unlinkSync(req.file.path);
            res.status(500).json({ error: "CSV parsing error" });
        });
});

// ==================== APPLICANT ROUTES ====================

// Get all applicants with advanced filtering and pagination
app.get("/api/applicants", async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            status,
            department,
            position,
            priority,
            hrAssigned,
            dateFrom,
            dateTo,
            sortBy = 'lastUpdated',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        let filter = {};
        if (status) filter.status = status;
        if (department) filter.department = department;
        if (position) filter.position = new RegExp(position, 'i');
        if (priority) filter.priority = priority;
        if (hrAssigned) filter.assignedTo = hrAssigned;

        if (dateFrom || dateTo) {
            filter.dateApplied = {};
            if (dateFrom) filter.dateApplied.$gte = new Date(dateFrom);
            if (dateTo) filter.dateApplied.$lte = new Date(dateTo);
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [applicants, total] = await Promise.all([
            Applicant.find(filter)
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Applicant.countDocuments(filter)
        ]);

        res.json({
            applicants,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            },
            filters: { status, department, position, priority, hrAssigned, dateFrom, dateTo }
        });
    } catch (err) {
        console.error("❌ Error fetching applicants:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Alternative endpoint for HR dashboard
app.get("/api/hiresight/applicant", async (req, res) => {
    try {
        const applicants = await Applicant.find();
        res.json(applicants);
    } catch (err) {
        console.error("❌ Error fetching applicants:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Add new applicant
app.post("/api/applicants", async (req, res) => {
    try {
        const newApplicant = new Applicant(req.body);
        await newApplicant.save();
        res.status(201).json(newApplicant);
    } catch (err) {
        console.error("❌ Error adding applicant:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Get single applicant by id (full detail)
app.get("/api/applicants/:id", async (req, res) => {
    try {
        const applicant = await Applicant.findById(req.params.id);
        if (!applicant) {
            return res.status(404).json({ error: "Applicant not found" });
        }
        res.json(applicant);
    } catch (err) {
        console.error("❌ Error fetching applicant by id:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Update applicant status (HR functionality)
app.put("/api/applicants/:id", async (req, res) => {
    try {
        const updatedApplicant = await Applicant.findByIdAndUpdate(
            req.params.id,
            { ...req.body, lastUpdated: new Date() },
            { new: true }
        );
        if (!updatedApplicant) {
            return res.status(404).json({ error: "Applicant not found" });
        }
        res.json(updatedApplicant);
    } catch (err) {
        console.error("❌ Error updating applicant:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Update applicant status only
app.patch("/api/applicants/:id/status", async (req, res) => {
    try {
        const { status, hrNotes, interviewDate, interviewFeedback } = req.body;
        const updateData = {
            status,
            lastUpdated: new Date(),
            hrProcessed: true
        };

        if (hrNotes) updateData.hrNotes = hrNotes;
        if (interviewDate) updateData.interviewDate = new Date(interviewDate);
        if (interviewFeedback) updateData.interviewFeedback = interviewFeedback;

        const updatedApplicant = await Applicant.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedApplicant) {
            return res.status(404).json({ error: "Applicant not found" });
        }
        res.json(updatedApplicant);
    } catch (err) {
        console.error("❌ Error updating applicant status:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Bulk update applicant statuses
app.patch("/api/applicants/bulk/status", async (req, res) => {
    try {
        const { applicantIds, status, hrNotes } = req.body;
        if (!applicantIds || !Array.isArray(applicantIds)) {
            return res.status(400).json({ error: "Applicant IDs array is required" });
        }

        const updateData = {
            status,
            lastUpdated: new Date(),
            hrProcessed: true
        };
        if (hrNotes) updateData.hrNotes = hrNotes;

        const result = await Applicant.updateMany(
            { _id: { $in: applicantIds } },
            updateData
        );
        res.json({ message: `${result.modifiedCount} applicants updated successfully` });
    } catch (err) {
        console.error("❌ Error bulk updating applicants:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Get applicants by status
app.get("/api/applicants/status/:status", async (req, res) => {
    try {
        const applicants = await Applicant.find({ status: req.params.status });
        res.json(applicants);
    } catch (err) {
        console.error("❌ Error fetching applicants by status:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Get applicant stats
app.get("/api/applicants/stats", async (req, res) => {
    try {
        const stats = await Applicant.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);
        const total = await Applicant.countDocuments();
        const result = { total };
        stats.forEach(stat => {
            result[stat._id.toLowerCase().replace(/ /g, '')] = stat.count;
        });
        res.json(result);
    } catch (err) {
        console.error("❌ Error fetching applicant stats:", err);
        res.status(500).json({ message: err.message });
    }
});

// Get applicant status distribution
app.get("/api/applicants/status-distribution", async (req, res) => {
    try {
        const distribution = await Applicant.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);
        res.json(distribution);
    } catch (err) {
        console.error("❌ Error fetching status distribution:", err);
        res.status(500).json({ message: err.message });
    }
});

// Get performance distribution (static for now)
app.get("/api/applicants/performance-distribution", (req, res) => {
    res.json([
        { label: 'Excellent', value: 40 },
        { label: 'Good', value: 35 },
        { label: 'Average', value: 15 },
        { label: 'Poor', value: 10 },
    ]);
});

// Alternative endpoint for HR dashboard
app.post("/api/hiresight/applicant", async (req, res) => {
    try {
        const newApplicant = new Applicant(req.body);
        await newApplicant.save();
        res.status(201).json(newApplicant);
    } catch (err) {
        console.error("❌ Error adding applicant:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ==================== ENHANCED HR DASHBOARD APIS ====================

// Get HR-specific dashboard statistics
app.get("/api/hr/dashboard/stats", async (req, res) => {
    try {
        const { hrUser } = req.query;

        // Build filter for HR-assigned applications
        let hrFilter = {};
        if (hrUser) {
            hrFilter.assignedTo = hrUser;
        }

        const [myApplicants, todaysInterviews, pendingActions, recentActivity] = await Promise.all([
            // My assigned applicants statistics
            Applicant.aggregate([
                { $match: hrFilter },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                        avgSalary: { $avg: "$expectedSalary" }
                    }
                }
            ]),
            // Today's scheduled interviews
            Applicant.find({
                ...hrFilter,
                interviewDate: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setHours(23, 59, 59, 999))
                },
                status: 'Interview Scheduled'
            }).select('name position interviewDate phone email'),

            // Pending actions count
            Applicant.countDocuments({
                ...hrFilter,
                status: { $in: ['Applied', 'Under Review'] }
            }),

            // Recent activity (last 20)
            Applicant.find(hrFilter)
                .sort({ lastUpdated: -1 })
                .limit(20)
                .select('name position status lastUpdated priority')
        ]);

        // Process applicant statistics
        const statusStats = {};
        let totalAssigned = 0;
        myApplicants.forEach(stat => {
            statusStats[stat._id] = {
                count: stat.count,
                avgSalary: stat.avgSalary
            };
            totalAssigned += stat.count;
        });

        res.json({
            assignedApplicants: {
                total: totalAssigned,
                byStatus: statusStats
            },
            todaysInterviews,
            pendingActions,
            recentActivity,
            summary: {
                interviewsToday: todaysInterviews.length,
                pendingReviews: pendingActions,
                totalAssigned
            }
        });
    } catch (err) {
        console.error("❌ Error fetching HR dashboard stats:", err);
        res.status(500).json({ message: err.message });
    }
});

// Schedule interview for applicant
app.post("/api/hr/interview/schedule", async (req, res) => {
    try {
        const { applicantId, interviewDate, interviewType, notes, hrUser } = req.body;

        const applicant = await Applicant.findByIdAndUpdate(
            applicantId,
            {
                status: 'Interview Scheduled',
                interviewDate: new Date(interviewDate),
                hrNotes: notes || '',
                assignedTo: hrUser,
                lastUpdated: new Date()
            },
            { new: true }
        );

        if (!applicant) {
            return res.status(404).json({ error: "Applicant not found" });
        }

        // Create interview record (if you want to track interviews separately)
        // This could be a separate Interview schema

        res.json({
            message: "Interview scheduled successfully",
            applicant,
            interviewDetails: {
                date: interviewDate,
                type: interviewType,
                scheduled_by: hrUser
            }
        });
    } catch (err) {
        console.error("❌ Error scheduling interview:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Update interview feedback
app.post("/api/hr/interview/feedback", async (req, res) => {
    try {
        const { applicantId, feedback, recommendation, nextSteps, rating } = req.body;

        // First get the current applicant data
        const currentApplicant = await Applicant.findById(applicantId);
        if (!currentApplicant) {
            return res.status(404).json({ error: "Applicant not found" });
        }

        const applicant = await Applicant.findByIdAndUpdate(
            applicantId,
            {
                interviewFeedback: feedback,
                status: recommendation === 'hire' ? 'Selected' :
                    recommendation === 'reject' ? 'Rejected' : 'Under Review',
                hrNotes: `${currentApplicant.hrNotes || ''}
Interview Feedback: ${feedback}
Rating: ${rating}/10
Next Steps: ${nextSteps}`,
                lastUpdated: new Date(),
                hrProcessed: true
            },
            { new: true }
        );

        if (!applicant) {
            return res.status(404).json({ error: "Applicant not found" });
        }

        res.json({
            message: "Interview feedback updated successfully",
            applicant
        });
    } catch (err) {
        console.error("❌ Error updating interview feedback:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Get my assigned applicants (HR-specific)
app.get("/api/hr/my-applicants", async (req, res) => {
    try {
        const { hrUser, status, priority } = req.query;

        if (!hrUser) {
            return res.status(400).json({ error: "HR user parameter is required" });
        }

        let filter = { assignedTo: hrUser };
        if (status) filter.status = status;
        if (priority) filter.priority = priority;

        const applicants = await Applicant.find(filter)
            .sort({ priority: 1, lastUpdated: -1 });

        res.json(applicants);
    } catch (err) {
        console.error("❌ Error fetching assigned applicants:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Get interview calendar for HR
app.get("/api/hr/interview-calendar", async (req, res) => {
    try {
        const { hrUser, startDate, endDate } = req.query;

        let filter = {
            status: 'Interview Scheduled',
            interviewDate: { $exists: true }
        };

        if (hrUser) {
            filter.assignedTo = hrUser;
        }

        if (startDate && endDate) {
            filter.interviewDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const interviews = await Applicant.find(filter)
            .select('name email phone position department interviewDate priority hrNotes')
            .sort({ interviewDate: 1 });

        res.json(interviews);
    } catch (err) {
        console.error("❌ Error fetching interview calendar:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Bulk assign applicants to HR
app.post("/api/hr/bulk-assign", async (req, res) => {
    try {
        const { applicantIds, hrUser, priority } = req.body;

        if (!applicantIds || !Array.isArray(applicantIds)) {
            return res.status(400).json({ error: "Applicant IDs array is required" });
        }

        const updateData = {
            assignedTo: hrUser,
            lastUpdated: new Date()
        };

        if (priority) {
            updateData.priority = priority;
        }

        const result = await Applicant.updateMany(
            { _id: { $in: applicantIds } },
            updateData
        );

        res.json({
            message: `${result.modifiedCount} applicants assigned successfully`,
            assigned_to: hrUser,
            count: result.modifiedCount
        });
    } catch (err) {
        console.error("❌ Error bulk assigning applicants:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Get HR performance metrics
app.get("/api/hr/performance", async (req, res) => {
    try {
        const { hrUser, period = 'monthly' } = req.query;

        if (!hrUser) {
            return res.status(400).json({ error: "HR user parameter is required" });
        }

        // Calculate date range based on period
        const now = new Date();
        let startDate;
        switch (period) {
            case 'weekly':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'yearly':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default: // monthly
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const performance = await Applicant.aggregate([
            {
                $match: {
                    assignedTo: hrUser,
                    lastUpdated: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalProcessed: { $sum: 1 },
                    interviewed: { $sum: { $cond: [{ $eq: ["$status", "Interview Scheduled"] }, 1, 0] } },
                    selected: { $sum: { $cond: [{ $eq: ["$status", "Selected"] }, 1, 0] } },
                    hired: { $sum: { $cond: [{ $eq: ["$status", "Hired"] }, 1, 0] } },
                    rejected: { $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] } },
                    avgProcessingTime: {
                        $avg: {
                            $divide: [
                                { $subtract: ["$lastUpdated", "$dateApplied"] },
                                86400000 // Convert to days
                            ]
                        }
                    }
                }
            }
        ]);

        const metrics = performance[0] || {};

        // Calculate efficiency metrics
        const efficiency = {
            selectionRate: metrics.totalProcessed ? (metrics.selected / metrics.totalProcessed * 100).toFixed(2) : 0,
            interviewRate: metrics.totalProcessed ? (metrics.interviewed / metrics.totalProcessed * 100).toFixed(2) : 0,
            hireRate: metrics.totalProcessed ? (metrics.hired / metrics.totalProcessed * 100).toFixed(2) : 0,
            avgProcessingDays: metrics.avgProcessingTime ? metrics.avgProcessingTime.toFixed(1) : 0
        };

        res.json({
            period,
            metrics,
            efficiency,
            hrUser
        });
    } catch (err) {
        console.error("❌ Error fetching HR performance:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Create quick notes for applicant
app.post("/api/hr/applicant-notes", async (req, res) => {
    try {
        const { applicantId, note, noteType = 'general' } = req.body;

        const timestamp = new Date().toISOString();
        const formattedNote = `[${timestamp}] ${noteType.toUpperCase()}: ${note}`;

        const applicant = await Applicant.findByIdAndUpdate(
            applicantId,
            {
                $push: {
                    hrNotes: { $each: [formattedNote], $position: 0 }
                },
                lastUpdated: new Date()
            },
            { new: true }
        );

        if (!applicant) {
            return res.status(404).json({ error: "Applicant not found" });
        }

        res.json({ message: "Note added successfully", applicant });
    } catch (err) {
        console.error("❌ Error adding applicant note:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ==================== DATA MANAGEMENT ROUTES ====================

// Clear all admin dashboard data (hiring data)
app.delete("/api/admin/clear-hiring-data", async (req, res) => {
    try {
        const { adminEmail } = req.body;

        // Verify admin authorization
        if (!adminEmail) {
            return res.status(403).json({ error: "Admin authorization required" });
        }

        const adminUser = await UserManagement.findOne({
            email: adminEmail.toLowerCase(),
            role: 'Admin',
            status: 'Active'
        });

        if (!adminUser) {
            return res.status(403).json({ error: "Invalid admin credentials" });
        }

        // Clear hiring data
        const hiringResult = await Hiring.deleteMany({});

        console.log(`✅ Admin ${adminUser.name} cleared ${hiringResult.deletedCount} hiring records`);

        res.json({
            message: "Hiring data cleared successfully",
            deletedRecords: hiringResult.deletedCount,
            clearedBy: adminUser.name
        });
    } catch (err) {
        console.error("❌ Error clearing hiring data:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Clear all admin transfer data
app.delete("/api/admin/clear-transfer-data", async (req, res) => {
    try {
        const { adminEmail } = req.body;

        // Verify admin authorization
        if (!adminEmail) {
            return res.status(403).json({ error: "Admin authorization required" });
        }

        const adminUser = await UserManagement.findOne({
            email: adminEmail.toLowerCase(),
            role: 'Admin',
            status: 'Active'
        });

        if (!adminUser) {
            return res.status(403).json({ error: "Invalid admin credentials" });
        }

        // Clear admin HR transfer data
        const transferResult = await AdminHRTransfer.deleteMany({});

        console.log(`✅ Admin ${adminUser.name} cleared ${transferResult.deletedCount} transfer records`);

        res.json({
            message: "Admin transfer data cleared successfully",
            deletedRecords: transferResult.deletedCount,
            clearedBy: adminUser.name
        });
    } catch (err) {
        console.error("❌ Error clearing transfer data:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Clear all admin related data (hiring + transfers + CSV data)
app.delete("/api/admin/clear-all-admin-data", async (req, res) => {
    try {
        const { adminEmail } = req.body;

        // Verify admin authorization
        if (!adminEmail) {
            return res.status(403).json({ error: "Admin authorization required" });
        }

        const adminUser = await UserManagement.findOne({
            email: adminEmail.toLowerCase(),
            role: 'Admin',
            status: 'Active'
        });

        if (!adminUser) {
            return res.status(403).json({ error: "Invalid admin credentials" });
        }

        // Clear multiple collections
        const [hiringResult, transferResult, applicantResult] = await Promise.all([
            Hiring.deleteMany({}),
            AdminHRTransfer.deleteMany({}),
            Applicant.deleteMany({ source: 'CSV Import' }) // Only CSV imported applicants
        ]);

        console.log(`✅ Admin ${adminUser.name} cleared all admin data:`);
        console.log(`   - ${hiringResult.deletedCount} hiring records`);
        console.log(`   - ${transferResult.deletedCount} transfer records`);
        console.log(`   - ${applicantResult.deletedCount} CSV applicant records`);

        res.json({
            message: "All admin data cleared successfully",
            deletedRecords: {
                hiring: hiringResult.deletedCount,
                transfers: transferResult.deletedCount,
                csvApplicants: applicantResult.deletedCount
            },
            clearedBy: adminUser.name
        });
    } catch (err) {
        console.error("❌ Error clearing all admin data:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Get data count for verification
app.get("/api/admin/data-count", async (req, res) => {
    try {
        const counts = {
            hiring: await Hiring.countDocuments(),
            transfers: await AdminHRTransfer.countDocuments(),
            applicants: await Applicant.countDocuments(),
            csvApplicants: await Applicant.countDocuments({ source: 'CSV Import' }),
            users: await UserManagement.countDocuments()
        };

        res.json(counts);
    } catch (err) {
        console.error("❌ Error getting data counts:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ==================== ADMIN TO HR TRANSFER ROUTES ====================

// Create transfer from Admin to HR
app.post("/api/admin-transfer", async (req, res) => {
    try {
        console.log('📩 Incoming transfer request:', req.body);

        const { toHR, transferType, jobPostings, applicants, message, priority } = req.body;

        // Validate required fields
        if (!toHR || (!jobPostings?.length && !applicants?.length)) {
            return res.status(400).json({
                error: "HR recipient and either jobPostings or applicants are required"
            });
        }

        // Map transferType to valid schema values
        let mappedTransferType = 'Applicant Data';
        if (transferType === 'Job Postings' || transferType === 'Job Posting') {
            mappedTransferType = 'Job Posting';
        } else if (transferType === 'Bulk Applicant Transfer' || transferType === 'Applicant Data') {
            mappedTransferType = 'Applicant Data';
        } else if (transferType === 'Mixed') {
            mappedTransferType = 'Mixed';
        }

        const transfer = new AdminHRTransfer({
            transferId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fromAdmin: req.body.fromAdmin || 'Admin',
            toHR: Array.isArray(toHR) ? toHR : [toHR],
            transferType: mappedTransferType,
            jobPostings: jobPostings || [],
            applicants: applicants || [],
            message: message || '',
            priority: priority || 'Medium',
            status: req.body.status || 'Pending'
        });

        const savedTransfer = await transfer.save();
        console.log('✅ Transfer created successfully:', savedTransfer._id);

        // Mark applicants as sent to HR if included
        if (applicants && applicants.length > 0) {
            const updateResult = await Applicant.updateMany(
                { _id: { $in: applicants } },
                {
                    sentToHR: true,
                    adminApproved: true,
                    lastUpdated: new Date(),
                    hrNotes: `Bulk transferred to ${Array.isArray(toHR) ? toHR.join(', ') : toHR} on ${new Date().toLocaleDateString()}`
                }
            );
            console.log(`✅ Updated ${updateResult.modifiedCount} applicants as sent to HR`);
        }

        res.status(201).json(savedTransfer);
    } catch (err) {
        console.error("❌ Error creating admin transfer:", err);
        console.error("Error details:", err.message);
        res.status(500).json({
            error: "Failed to create transfer",
            details: err.message
        });
    }
});

// Get all transfers for HR
app.get("/api/hr-transfers", async (req, res) => {
    try {
        const { hrUser } = req.query;
        let query = {};
        if (hrUser) {
            query.toHR = { $in: [hrUser] };
        }

        const transfers = await AdminHRTransfer.find(query)
            .populate('jobPostings')
            .populate('applicants')
            .sort({ transferDate: -1 });
        res.json(transfers);
    } catch (err) {
        console.error("❌ Error fetching HR transfers:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Get all transfers for Admin
app.get("/api/admin-transfers", async (req, res) => {
    try {
        const transfers = await AdminHRTransfer.find()
            .populate('jobPostings')
            .populate('applicants')
            .sort({ transferDate: -1 });
        res.json(transfers);
    } catch (err) {
        console.error("❌ Error fetching admin transfers:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Update transfer status (HR accepting/processing)
app.patch("/api/admin-transfer/:id/status", async (req, res) => {
    try {
        const { status, hrFeedback } = req.body;
        const updateData = { status };

        if (status === 'Completed') {
            updateData.processedDate = new Date();
        }
        if (hrFeedback) {
            updateData.hrFeedback = hrFeedback;
        }

        const transfer = await AdminHRTransfer.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!transfer) {
            return res.status(404).json({ error: "Transfer not found" });
        }

        res.json(transfer);
    } catch (err) {
        console.error("❌ Error updating transfer status:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Get applicants pending HR processing
app.get("/api/applicants/pending-hr", async (req, res) => {
    try {
        const applicants = await Applicant.find({
            sentToHR: true,
            hrProcessed: false
        }).sort({ lastUpdated: -1 });
        res.json(applicants);
    } catch (err) {
        console.error("❌ Error fetching pending HR applicants:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ==================== USER MANAGEMENT ROUTES ====================

// Get all users for user management
app.get("/api/users", async (req, res) => {
    try {
        const users = await UserManagement.find();
        res.json(users);
    } catch (err) {
        console.error("❌ Error fetching users:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Admin-only user creation API
app.post("/api/admin/create-user", async (req, res) => {
    try {
        const { role, name, email, password, department, createdByAdmin, adminEmail } = req.body;

        // Verify admin authorization
        if (!adminEmail) {
            return res.status(403).json({ error: "Admin authorization required" });
        }

        const adminUser = await UserManagement.findOne({
            email: adminEmail.toLowerCase(),
            role: 'Admin',
            status: 'Active'
        });

        if (!adminUser) {
            return res.status(403).json({ error: "Invalid admin credentials" });
        }

        // Input validation
        if (!role || !name || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Check duplicate email
        const existing = await UserManagement.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const newUser = new UserManagement({
            role,
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            status: 'Active',
            department: department || null,
            createdBy: adminUser.name,
            permissions: getDefaultPermissions(role)
        });

        await newUser.save();

        // Also create in User collection for backward compatibility
        const legacyUser = new User({
            role,
            name,
            email: email.toLowerCase(),
            password: hashedPassword
        });
        await legacyUser.save();

        console.log(`✅ Admin ${adminUser.name} created user: ${email} as ${role}`);

        // Remove password from response
        const responseUser = { ...newUser.toObject() };
        delete responseUser.password;

        res.status(201).json({
            message: "User created successfully",
            user: responseUser
        });
    } catch (err) {
        console.error("❌ Error creating user:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Enhanced user management - Add new user (legacy endpoint, now with restrictions)
app.post("/api/users", async (req, res) => {
    try {
        const { role } = req.body;

        // Restrict creation of admin/hr roles through this endpoint
        const restrictedRoles = ['Admin', 'HR'];
        if (restrictedRoles.includes(role)) {
            return res.status(403).json({
                error: "Use /api/admin/create-user endpoint for creating Admin or HR accounts"
            });
        }

        // Hash password if provided
        if (req.body.password) {
            const saltRounds = 12;
            req.body.password = await bcrypt.hash(req.body.password, saltRounds);
        }

        const newUser = new UserManagement(req.body);
        await newUser.save();

        // Remove password from response
        const responseUser = { ...newUser.toObject() };
        delete responseUser.password;

        res.status(201).json(responseUser);
    } catch (err) {
        console.error("❌ Error adding user:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Helper function to get default permissions based on role
function getDefaultPermissions(role) {
    const permissions = {
        'Admin': ['all'],
        'HR': ['view_applicants', 'manage_applicants', 'schedule_interviews', 'view_reports'],
        'User': ['view_own_profile', 'upload_resume']
    };
    return permissions[role] || permissions['User'];
}

// Update user
app.put("/api/users/:id", async (req, res) => {
    try {
        const updateData = { ...req.body };

        // Hash password if provided
        if (updateData.password) {
            const saltRounds = 12;
            updateData.password = await bcrypt.hash(updateData.password, saltRounds);
        }

        updateData.updatedAt = new Date();

        const updatedUser = await UserManagement.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Also update User collection for backward compatibility
        if (updateData.password || updateData.email || updateData.name || updateData.role) {
            await User.findOneAndUpdate(
                { email: updatedUser.email },
                {
                    email: updatedUser.email,
                    name: updatedUser.name,
                    role: updatedUser.role,
                    password: updatedUser.password
                },
                { upsert: true }
            );
        }

        // Remove password from response
        const responseUser = { ...updatedUser.toObject() };
        delete responseUser.password;

        res.json(responseUser);
    } catch (err) {
        console.error("❌ Error updating user:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Update user password
app.patch("/api/users/:id/password", async (req, res) => {
    try {
        const { newPassword, adminEmail } = req.body;

        // Verify admin authorization
        if (!adminEmail) {
            return res.status(403).json({ error: "Admin authorization required" });
        }

        const adminUser = await UserManagement.findOne({
            email: adminEmail.toLowerCase(),
            role: 'Admin',
            status: 'Active'
        });

        if (!adminUser) {
            return res.status(403).json({ error: "Invalid admin credentials" });
        }

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long" });
        }

        // Hash new password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        const updatedUser = await UserManagement.findByIdAndUpdate(
            req.params.id,
            {
                password: hashedPassword,
                updatedAt: new Date(),
                // Reset login attempts when password is changed
                loginAttempts: 0,
                lockUntil: null
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Also update User collection for backward compatibility
        await User.findOneAndUpdate(
            { email: updatedUser.email },
            { password: hashedPassword },
            { upsert: true }
        );

        console.log(`✅ Admin ${adminUser.name} updated password for user: ${updatedUser.email}`);

        res.json({ message: "Password updated successfully" });
    } catch (err) {
        console.error("❌ Error updating password:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Delete user
app.delete("/api/users/:id", async (req, res) => {
    try {
        const deletedUser = await UserManagement.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({ message: "User deleted successfully", user: deletedUser });
    } catch (err) {
        console.error("❌ Error deleting user:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Delete multiple users
app.delete("/api/users/bulk", async (req, res) => {
    try {
        const { userIds } = req.body;
        if (!userIds || !Array.isArray(userIds)) {
            return res.status(400).json({ error: "User IDs array is required" });
        }
        const result = await UserManagement.deleteMany({ _id: { $in: userIds } });
        res.json({ message: `${result.deletedCount} users deleted successfully` });
    } catch (err) {
        console.error("❌ Error deleting users:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Update user status (activate/deactivate)
app.patch("/api/users/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const updatedUser = await UserManagement.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(updatedUser);
    } catch (err) {
        console.error("❌ Error updating user status:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Bulk update user status
app.patch("/api/users/bulk/status", async (req, res) => {
    try {
        const { userIds, status } = req.body;
        if (!userIds || !Array.isArray(userIds)) {
            return res.status(400).json({ error: "User IDs array is required" });
        }
        const result = await UserManagement.updateMany(
            { _id: { $in: userIds } },
            { status }
        );
        res.json({ message: `${result.modifiedCount} users updated successfully` });
    } catch (err) {
        console.error("❌ Error updating user status:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Upload user management CSV
app.post("/api/usermanagement", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", () => {
            UserManagement.insertMany(results)
                .then(() => {
                    fs.unlinkSync(req.file.path);
                    res.status(201).json({ message: "CSV data imported successfully" });
                })
                .catch((err) => {
                    console.error("❌ Error importing user data:", err);
                    res.status(500).json({ error: "Server error" });
                });
        })
        .on("error", (err) => {
            console.error("❌ CSV parsing error:", err);
            fs.unlinkSync(req.file.path);
            res.status(500).json({ error: "CSV parsing error" });
        });
});

// ==================== RESUME ROUTES ====================

// Import the resume analyzer
const ResumeAnalyzer = require('./services/resumeAnalyzer');
const resumeAnalyzer = new ResumeAnalyzer();

// Helper function to get suggestion icons
function getSuggestionIcon(category) {
    const iconMap = {
        'format': '🎨',
        'content': '📝',
        'keywords': '🔑',
        'structure': '🏗️',
        'ats': '🤖',
        'skills': '⚡',
        'experience': '💼',
        'education': '🎓',
        'contact': '📞',
        'general': '💡'
    };
    return iconMap[category?.toLowerCase()] || '💡';
}

// Enhanced resume upload endpoint with comprehensive analysis
app.post("/api/resumeupload", upload.single("resume"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    console.log(`📤 Uploaded file: ${req.file.originalname}`);
    console.log(`📝 File size: ${req.file.size} bytes`);
    console.log(`📁 File path: ${req.file.path}`);

    try {
        // Handle CSV files separately (existing functionality)
        if (req.file.mimetype === "text/csv") {
            const results = [];
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on("data", (data) => results.push(data))
                .on("end", () => {
                    const resumes = results.map(row => {
                        return {
                            fileName: req.file.originalname,
                            textContent: JSON.stringify(row),
                            csvContent: new Parser().parse([row]),
                        };
                    });

                    Resume.insertMany(resumes)
                        .then(() => {
                            fs.unlinkSync(req.file.path);
                            res.status(201).json({ message: "CSV data imported successfully" });
                        })
                        .catch((err) => {
                            console.error("❌ Error importing resume data:", err);
                            res.status(500).json({ error: "Server error" });
                        });
                });
            return;
        }

        // Read file buffer for analysis
        const fileBuffer = fs.readFileSync(req.file.path);
        const jobDescription = req.body.jobDescription || ''; // Optional job description for keyword matching

        // Supported file types for analysis
        const supportedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword"
        ];

        if (!supportedTypes.includes(req.file.mimetype)) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                error: "Unsupported file type. Please upload PDF, DOC, or DOCX files."
            });
        }

        console.log("🔍 Starting comprehensive resume analysis...");

        // Perform comprehensive resume analysis
        let analysis;
        try {
            analysis = await resumeAnalyzer.analyzeResume(
                fileBuffer,
                req.file.originalname,
                jobDescription
            );
        } catch (analysisError) {
            console.error("❌ Resume analysis failed:", analysisError);
            fs.unlinkSync(req.file.path);
            return res.status(500).json({
                success: false,
                error: "Resume analysis failed",
                details: analysisError.message
            });
        }

        console.log("✅ Resume analysis completed!");
        console.log(`📊 Overall Score: ${analysis.scores.overall}/100`);
        console.log(`🎯 ATS Score: ${analysis.scores.ats}/100`);
        console.log(`📝 Content Score: ${analysis.scores.content}/100`);
        console.log(`💡 Suggestions: ${analysis.suggestions.length}`);

        // Create resume record with analysis data
        const resume = new Resume({
            fileName: req.file.originalname,
            textContent: analysis.textContent,
            csvContent: new Parser({ fields: ["lineNo", "text"] }).parse(
                analysis.textContent.split("\n")
                    .filter(line => line.trim() !== "")
                    .map((line, i) => ({ lineNo: i + 1, text: line }))
            ),
            // Store comprehensive analysis results
            analysisData: {
                scores: analysis.scores,
                sections: analysis.sections,
                keywords: analysis.keywords,
                atsCompatibility: analysis.atsCompatibility,
                contentQuality: analysis.contentQuality,
                formatScore: analysis.formatScore,
                suggestions: analysis.suggestions,
                sentiment: analysis.sentiment,
                readability: analysis.readability,
                analysisTimestamp: analysis.analysisTimestamp
            }
        });

        await resume.save();
        console.log(`💾 Resume saved with ID: ${resume._id}`);

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        // Return comprehensive analysis results for frontend
        res.json({
            success: true,
            message: "Resume analyzed successfully!",
            resumeId: resume._id,
            analysis: {
                // Overall metrics for dashboard cards
                overall: {
                    score: analysis.scores.overall,
                    atsCompatible: analysis.scores.ats >= 80 ? 'Yes' : 'Needs Improvement',
                    keywordsFound: analysis.keywords.industryKeywords.length,
                    improvementCount: analysis.suggestions.length
                },

                // Detailed scores for analysis tabs
                scores: {
                    ats: analysis.scores.ats,
                    content: analysis.scores.content,
                    format: analysis.scores.format,
                    keywords: analysis.scores.keywords,
                    sections: analysis.scores.sections
                },

                // Section analysis for structure tab
                sections: Object.keys(analysis.sections).map(key => ({
                    name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                    present: analysis.sections[key].present,
                    strength: Math.round(analysis.sections[key].strength || 0)
                })),

                // Keyword analysis for keywords tab
                keywords: {
                    found: analysis.keywords.industryKeywords.slice(0, 15),
                    missing: analysis.keywords.missingKeywords.slice(0, 10),
                    matchingScore: Math.round(analysis.keywords.matchingScore)
                },

                // Prioritized suggestions for suggestions tab
                suggestions: analysis.suggestions.map(suggestion => ({
                    icon: getSuggestionIcon(suggestion.category),
                    title: suggestion.title,
                    description: suggestion.description,
                    impact: suggestion.priority.charAt(0).toUpperCase() + suggestion.priority.slice(1),
                    details: suggestion.suggestions
                })),

                // Additional insights
                insights: {
                    wordCount: analysis.contentQuality.wordCount,
                    readabilityLevel: analysis.readability.readabilityLevel,
                    sentimentOverall: analysis.sentiment.overall,
                    hasQuantifiedAchievements: analysis.sections.experience?.details?.hasQuantifiedAchievements || false,
                    actionWordCount: analysis.contentQuality.actionWordCount,
                    avgSentenceLength: analysis.readability.avgSentenceLength
                }
            }
        });

    } catch (err) {
        console.error("❌ Error processing resume:", err);

        // Clean up file if it exists
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            error: "Resume analysis failed",
            details: err.message
        });
    }
});

// Get all resumes
app.get("/api/resumes", async (req, res) => {
    try {
        const resumes = await Resume.find().sort({ uploadedAt: -1 });
        res.json(resumes);
    } catch (err) {
        console.error("❌ Error fetching resumes:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ==================== STATIC ROUTE HANDLERS ====================

// Serve HTML pages
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/adminhome', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'adminhome.html'));
});

app.get('/admindashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admindashboard.html'));
});

app.get('/hrdashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'hrdashboard.html'));
});

app.get('/resumehome', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'resumehome.html'));
});

app.get('/resumeupload', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'resumeupload.html'));
});

app.get('/usermanagement', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'usermanagement.html'));
});

app.get('/hr-applicants', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'hr-applicants.html'));
});

app.get('/admin-transfer', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-transfer.html'));
});

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
    console.error("❌ Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
    console.log(`✅ HireSight Server running on http://localhost:${PORT}`);
    console.log(`📁 Serving static files from: ${path.join(__dirname, 'public')}`);
    console.log(`📤 Upload directory: ${uploadsDir}`);
});

module.exports = app;