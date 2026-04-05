const mongoose = require('mongoose');

// MongoDB connection configuration
const mongoConfig = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferMaxEntries: 0,
    bufferCommands: false,
};

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/hiresight", mongoConfig);

// ========================= SCHEMAS =========================

// User Schema (for authentication)
const userSchema = new mongoose.Schema({
    role: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { collection: "userdetail" });

// Enhanced Applicant Schema
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
    status: { 
        type: String, 
        enum: ['Applied', 'Under Review', 'Interview Scheduled', 'Selected', 'Rejected', 'Offer Extended', 'Hired'],
        default: 'Applied'
    },
    interviewDate: Date,
    interviewFeedback: String,
    hrNotes: String,
    assignedTo: String,
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    source: String,
    lastUpdated: { type: Date, default: Date.now },
    adminApproved: { type: Boolean, default: false },
    sentToHR: { type: Boolean, default: false },
    hrProcessed: { type: Boolean, default: false }
}, { collection: "applicants" });

// Comprehensive Hiring Data Schema
const hiringSchema = new mongoose.Schema({
    Department: String,
    Position: String,
    Location: String,
    JobDescription: String,
    Requirements: String,
    SalaryRange: String,
    JobType: String,
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
    hrAssigned: [String],
    adminNotes: String,
    lastUpdated: { type: Date, default: Date.now }
}, { collection: "hiring" });

// User Management Schema
const userManagementSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String,
    status: String,
    department: String,
    joinDate: { type: Date, default: Date.now },
    permissions: [String],
    lastLogin: Date,
    createdBy: String,
    updatedAt: { type: Date, default: Date.now }
}, { collection: "usermanagement" });

// Resume Schema
const resumeSchema = new mongoose.Schema({
    fileName: String,
    textContent: String,
    csvContent: String,
    uploadedAt: { type: Date, default: Date.now },
    processedBy: String,
    skills: [String],
    experience: String,
    education: String,
    contactInfo: {
        email: String,
        phone: String,
        location: String
    }
}, { collection: "resumes" });

// Admin to HR Data Transfer Schema
const adminHRTransferSchema = new mongoose.Schema({
    transferId: { type: String, unique: true, required: true },
    fromAdmin: String,
    toHR: [String],
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

// Analytics Schema
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
        hired: Number
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

// ========================= SAMPLE DATA =========================

const sampleUsers = [
    {
        role: "Admin",
        name: "System Administrator",
        email: "admin@hiresight.com",
        password: "admin123",
        status: "Active"
    },
    {
        role: "HR",
        name: "Sarah Johnson",
        email: "sarah.hr@hiresight.com",
        password: "hr123",
        status: "Active"
    },
    {
        role: "HR",
        name: "Michael Chen",
        email: "michael.hr@hiresight.com",
        password: "hr123",
        status: "Active"
    },
    {
        role: "User",
        name: "Demo User",
        email: "user@hiresight.com",
        password: "user123",
        status: "Active"
    }
];

const sampleApplicants = [
    {
        applicantId: "APP_2024_001",
        name: "John Smith",
        email: "john.smith@email.com",
        phone: "+1-555-0101",
        position: "Software Developer",
        department: "Technology",
        experience: "3 years",
        skills: ["JavaScript", "React", "Node.js", "MongoDB"],
        qualification: "B.S. Computer Science",
        currentSalary: 65000,
        expectedSalary: 75000,
        location: "New York, NY",
        status: "Under Review",
        source: "LinkedIn",
        priority: "High"
    },
    {
        applicantId: "APP_2024_002",
        name: "Emily Davis",
        email: "emily.davis@email.com",
        phone: "+1-555-0102",
        position: "UX Designer",
        department: "Design",
        experience: "5 years",
        skills: ["Figma", "Adobe XD", "Sketch", "Prototyping"],
        qualification: "M.A. Design",
        currentSalary: 70000,
        expectedSalary: 80000,
        location: "San Francisco, CA",
        status: "Interview Scheduled",
        source: "Company Website",
        priority: "High",
        interviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    },
    {
        applicantId: "APP_2024_003",
        name: "Robert Wilson",
        email: "robert.wilson@email.com",
        phone: "+1-555-0103",
        position: "Data Analyst",
        department: "Analytics",
        experience: "2 years",
        skills: ["Python", "SQL", "Tableau", "Excel"],
        qualification: "B.S. Statistics",
        currentSalary: 55000,
        expectedSalary: 65000,
        location: "Chicago, IL",
        status: "Selected",
        source: "Indeed",
        priority: "Medium"
    },
    {
        applicantId: "APP_2024_004",
        name: "Lisa Anderson",
        email: "lisa.anderson@email.com",
        phone: "+1-555-0104",
        position: "Marketing Manager",
        department: "Marketing",
        experience: "4 years",
        skills: ["Digital Marketing", "SEO", "Content Strategy", "Analytics"],
        qualification: "MBA Marketing",
        currentSalary: 75000,
        expectedSalary: 85000,
        location: "Austin, TX",
        status: "Applied",
        source: "Referral",
        priority: "Medium"
    },
    {
        applicantId: "APP_2024_005",
        name: "David Brown",
        email: "david.brown@email.com",
        phone: "+1-555-0105",
        position: "DevOps Engineer",
        department: "Technology",
        experience: "6 years",
        skills: ["Docker", "Kubernetes", "AWS", "Jenkins", "Python"],
        qualification: "B.S. Computer Engineering",
        currentSalary: 95000,
        expectedSalary: 110000,
        location: "Seattle, WA",
        status: "Offer Extended",
        source: "GitHub Jobs",
        priority: "High"
    }
];

const sampleHiringData = [
    {
        Department: "Technology",
        Position: "Senior Software Developer",
        Location: "New York, NY",
        JobDescription: "Lead development of web applications using modern technologies",
        Requirements: "5+ years experience, JavaScript, React, Node.js",
        SalaryRange: "$80,000 - $120,000",
        JobType: "Full-time",
        ExperienceLevel: "Senior",
        PostedDate: new Date(),
        ApplicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        Total: 25,
        Selected: 3,
        Rejected: 8,
        Pending: 14,
        Interviewed: 5,
        OfferExtended: 2,
        Hired: 1,
        Budget: 100000,
        Priority: "High",
        HiringManager: "Tech Lead",
        Status: "Open",
        hrAssigned: ["sarah.hr@hiresight.com"],
        adminNotes: "Critical position for Q1 project"
    },
    {
        Department: "Design",
        Position: "UX/UI Designer",
        Location: "San Francisco, CA",
        JobDescription: "Create intuitive user experiences for web and mobile applications",
        Requirements: "3+ years experience, Figma, Adobe Creative Suite",
        SalaryRange: "$70,000 - $95,000",
        JobType: "Full-time",
        ExperienceLevel: "Mid-level",
        PostedDate: new Date(),
        ApplicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        Total: 18,
        Selected: 2,
        Rejected: 6,
        Pending: 10,
        Interviewed: 3,
        OfferExtended: 1,
        Hired: 1,
        Budget: 82500,
        Priority: "Medium",
        HiringManager: "Design Head",
        Status: "Open",
        hrAssigned: ["michael.hr@hiresight.com"],
        adminNotes: "Focus on mobile-first design experience"
    },
    {
        Department: "Marketing",
        Position: "Digital Marketing Specialist",
        Location: "Austin, TX",
        JobDescription: "Develop and execute digital marketing campaigns",
        Requirements: "2+ years experience, Google Ads, SEO, Analytics",
        SalaryRange: "$55,000 - $75,000",
        JobType: "Full-time",
        ExperienceLevel: "Mid-level",
        PostedDate: new Date(),
        ApplicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        Total: 22,
        Selected: 1,
        Rejected: 10,
        Pending: 11,
        Interviewed: 2,
        OfferExtended: 1,
        Hired: 0,
        Budget: 65000,
        Priority: "Medium",
        HiringManager: "Marketing Director",
        Status: "Open",
        hrAssigned: ["sarah.hr@hiresight.com"],
        adminNotes: "Strong analytical skills required"
    }
];

const sampleUserManagement = [
    {
        name: "Sarah Johnson",
        email: "sarah.hr@hiresight.com",
        role: "HR Manager",
        status: "Active",
        department: "Human Resources",
        joinDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        permissions: ["View Applicants", "Update Status", "Schedule Interviews", "Generate Reports"],
        lastLogin: new Date(),
        createdBy: "System"
    },
    {
        name: "Michael Chen",
        email: "michael.hr@hiresight.com",
        role: "HR Specialist",
        status: "Active",
        department: "Human Resources",
        joinDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
        permissions: ["View Applicants", "Update Status", "Schedule Interviews"],
        lastLogin: new Date(),
        createdBy: "Sarah Johnson"
    },
    {
        name: "System Administrator",
        email: "admin@hiresight.com",
        role: "Administrator",
        status: "Active",
        department: "IT",
        joinDate: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000), // 2 years ago
        permissions: ["Full Access"],
        lastLogin: new Date(),
        createdBy: "System"
    }
];

const sampleAnalytics = [
    {
        type: "Monthly",
        date: new Date(),
        metrics: {
            applicationsReceived: 65,
            applicationsProcessed: 45,
            interviewsConducted: 15,
            offersExtended: 4,
            hiresCompleted: 2,
            averageTimeToHire: 21,
            costPerHire: 3500
        },
        departmentWise: [
            { department: "Technology", applicationsReceived: 30, hired: 1 },
            { department: "Design", applicationsReceived: 18, hired: 1 },
            { department: "Marketing", applicationsReceived: 17, hired: 0 }
        ]
    }
];

// ========================= INITIALIZATION FUNCTION =========================

async function initializeDatabase() {
    try {
        console.log('🚀 Starting HireSight database initialization...\n');

        // Clear existing data (optional - comment out if you want to preserve existing data)
        console.log('🧹 Clearing existing collections...');
        await User.deleteMany({});
        await Applicant.deleteMany({});
        await Hiring.deleteMany({});
        await UserManagement.deleteMany({});
        await Resume.deleteMany({});
        await AdminHRTransfer.deleteMany({});
        await Analytics.deleteMany({});

        // Create indexes for better performance
        console.log('🔍 Creating database indexes...');
        await User.createIndexes();
        await Applicant.createIndexes();
        await Hiring.createIndexes();
        await UserManagement.createIndexes();
        await Resume.createIndexes();
        await AdminHRTransfer.createIndexes();
        await Analytics.createIndexes();

        // Insert sample data
        console.log('📊 Inserting sample users...');
        await User.insertMany(sampleUsers);
        console.log(`   ✅ Inserted ${sampleUsers.length} users`);

        console.log('👥 Inserting sample applicants...');
        await Applicant.insertMany(sampleApplicants);
        console.log(`   ✅ Inserted ${sampleApplicants.length} applicants`);

        console.log('💼 Inserting sample hiring data...');
        await Hiring.insertMany(sampleHiringData);
        console.log(`   ✅ Inserted ${sampleHiringData.length} job postings`);

        console.log('🔧 Inserting sample user management data...');
        await UserManagement.insertMany(sampleUserManagement);
        console.log(`   ✅ Inserted ${sampleUserManagement.length} user management records`);

        console.log('📈 Inserting sample analytics data...');
        await Analytics.insertMany(sampleAnalytics);
        console.log(`   ✅ Inserted ${sampleAnalytics.length} analytics records`);

        console.log('\n🎉 Database initialization completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`   • Users: ${sampleUsers.length}`);
        console.log(`   • Applicants: ${sampleApplicants.length}`);
        console.log(`   • Job Postings: ${sampleHiringData.length}`);
        console.log(`   • User Management Records: ${sampleUserManagement.length}`);
        console.log(`   • Analytics Records: ${sampleAnalytics.length}`);

        console.log('\n🔐 Default Login Credentials:');
        console.log('   Admin: admin@hiresight.com / admin123');
        console.log('   HR: sarah.hr@hiresight.com / hr123');
        console.log('   HR: michael.hr@hiresight.com / hr123');
        console.log('   User: user@hiresight.com / user123');

        console.log('\n🔍 MongoDB Compass Connection:');
        console.log('   URL: mongodb://127.0.0.1:27017/hiresight');
        console.log('   Collections: userdetail, applicants, hiring, usermanagement, resumes, adminHRTransfers, analytics');

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
    } finally {
        mongoose.connection.close();
        console.log('\n🔌 Database connection closed.');
        process.exit(0);
    }
}

// Run initialization
initializeDatabase();