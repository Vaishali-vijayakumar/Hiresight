const mongoose = require('mongoose');

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/hiresight', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Import schemas (same as in app.js)
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
    lastUpdated: { type: Date, default: Date.now },
    source: String,
    csvUploadDate: Date,
    isCSVGenerated: Boolean,
    csvMetadata: {
        uploadTimestamp: Date,
        applicantCount: Number,
        uploadType: String
    }
}, { collection: "hiring" });

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

// Models
const Hiring = mongoose.model("Hiring", hiringSchema);
const AdminHRTransfer = mongoose.model("AdminHRTransfer", adminHRTransferSchema);
const Applicant = mongoose.model("Applicant", applicantSchema);

async function clearAdminData() {
    try {
        console.log('🧹 Starting admin data cleanup...\n');

        // Get current data counts
        console.log('📊 Current data counts:');
        const currentCounts = {
            hiring: await Hiring.countDocuments(),
            transfers: await AdminHRTransfer.countDocuments(),
            applicants: await Applicant.countDocuments(),
            csvApplicants: await Applicant.countDocuments({ source: 'CSV Import' })
        };
        
        console.log(`   - Hiring records: ${currentCounts.hiring}`);
        console.log(`   - Transfer records: ${currentCounts.transfers}`);
        console.log(`   - Total applicants: ${currentCounts.applicants}`);
        console.log(`   - CSV applicants: ${currentCounts.csvApplicants}\n`);

        if (currentCounts.hiring === 0 && currentCounts.transfers === 0 && currentCounts.csvApplicants === 0) {
            console.log('✅ No admin data found to clear.');
            return;
        }

        // Confirm deletion
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const answer = await new Promise(resolve => {
            readline.question('Are you sure you want to clear all admin data? (y/N): ', resolve);
        });
        readline.close();

        if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
            console.log('❌ Operation cancelled.');
            return;
        }

        console.log('\n🗑️  Clearing admin data...');

        // Clear data
        const results = await Promise.all([
            Hiring.deleteMany({}),
            AdminHRTransfer.deleteMany({}),
            Applicant.deleteMany({ source: 'CSV Import' })
        ]);

        console.log('\n✅ Data cleared successfully:');
        console.log(`   - Hiring records deleted: ${results[0].deletedCount}`);
        console.log(`   - Transfer records deleted: ${results[1].deletedCount}`);
        console.log(`   - CSV applicant records deleted: ${results[2].deletedCount}`);

        // Verify clearance
        const afterCounts = {
            hiring: await Hiring.countDocuments(),
            transfers: await AdminHRTransfer.countDocuments(),
            csvApplicants: await Applicant.countDocuments({ source: 'CSV Import' })
        };

        console.log('\n📊 Verification - remaining records:');
        console.log(`   - Hiring records: ${afterCounts.hiring}`);
        console.log(`   - Transfer records: ${afterCounts.transfers}`);
        console.log(`   - CSV applicants: ${afterCounts.csvApplicants}`);

        if (afterCounts.hiring === 0 && afterCounts.transfers === 0 && afterCounts.csvApplicants === 0) {
            console.log('\n🎉 All admin data successfully cleared!');
        } else {
            console.log('\n⚠️  Some records may still remain. Please check manually.');
        }

    } catch (error) {
        console.error('❌ Error clearing admin data:', error);
    } finally {
        mongoose.connection.close();
        console.log('\n🔌 Database connection closed.');
    }
}

// Additional function to clear specific collections
async function clearSpecificData(collections = []) {
    try {
        console.log(`🧹 Clearing specific collections: ${collections.join(', ')}\n`);

        const results = {};

        if (collections.includes('hiring')) {
            results.hiring = await Hiring.deleteMany({});
            console.log(`✅ Cleared ${results.hiring.deletedCount} hiring records`);
        }

        if (collections.includes('transfers')) {
            results.transfers = await AdminHRTransfer.deleteMany({});
            console.log(`✅ Cleared ${results.transfers.deletedCount} transfer records`);
        }

        if (collections.includes('csv-applicants')) {
            results.csvApplicants = await Applicant.deleteMany({ source: 'CSV Import' });
            console.log(`✅ Cleared ${results.csvApplicants.deletedCount} CSV applicant records`);
        }

        if (collections.includes('all-applicants')) {
            results.allApplicants = await Applicant.deleteMany({});
            console.log(`✅ Cleared ${results.allApplicants.deletedCount} applicant records`);
        }

        return results;

    } catch (error) {
        console.error('❌ Error clearing specific data:', error);
    }
}

// Command line interface
const args = process.argv.slice(2);

if (args.length === 0) {
    // Default: clear all admin data with confirmation
    clearAdminData();
} else if (args[0] === '--help') {
    console.log(`
📖 HireSight Admin Data Cleaner

Usage:
  node clear-admin-data.js                    # Clear all admin data (with confirmation)
  node clear-admin-data.js --hiring           # Clear only hiring data
  node clear-admin-data.js --transfers        # Clear only transfer data
  node clear-admin-data.js --csv-applicants   # Clear only CSV imported applicants
  node clear-admin-data.js --all-applicants   # Clear ALL applicant data
  node clear-admin-data.js --force            # Clear all admin data without confirmation
  node clear-admin-data.js --help             # Show this help

Collections affected:
  - hiring: Job postings and recruitment data
  - adminHRTransfers: Admin to HR transfer records
  - applicants: Applicant data (filtered by source for CSV)
    `);
} else if (args[0] === '--force') {
    // Force clear without confirmation
    (async () => {
        try {
            console.log('🧹 Force clearing all admin data...\n');
            const results = await Promise.all([
                Hiring.deleteMany({}),
                AdminHRTransfer.deleteMany({}),
                Applicant.deleteMany({ source: 'CSV Import' })
            ]);
            
            console.log('✅ Force clear completed:');
            console.log(`   - Hiring records: ${results[0].deletedCount}`);
            console.log(`   - Transfer records: ${results[1].deletedCount}`);
            console.log(`   - CSV applicants: ${results[2].deletedCount}`);
        } catch (error) {
            console.error('❌ Force clear failed:', error);
        } finally {
            mongoose.connection.close();
        }
    })();
} else {
    // Clear specific collections
    const collections = [];
    if (args.includes('--hiring')) collections.push('hiring');
    if (args.includes('--transfers')) collections.push('transfers');
    if (args.includes('--csv-applicants')) collections.push('csv-applicants');
    if (args.includes('--all-applicants')) collections.push('all-applicants');
    
    if (collections.length > 0) {
        clearSpecificData(collections).then(() => {
            mongoose.connection.close();
        });
    } else {
        console.log('❌ Invalid arguments. Use --help for usage information.');
        mongoose.connection.close();
    }
}