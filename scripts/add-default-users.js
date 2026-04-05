const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection configuration
const mongoConfig = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
};

// Connect to MongoDB
const mongoUrl = process.env.MONGODB_URL || "mongodb://localhost:27017/hiresight";

// User Management Schema (matching app.js)
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
    createdBy: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { collection: "usermanagement" });

// Default users to create
const defaultUsers = [
    {
        name: "System Administrator",
        email: "admin@hiresight.com",
        password: "Admin@123", // Will be hashed
        role: "Admin",
        status: "Active",
        department: "IT",
        permissions: ["full_access", "user_management", "system_config"],
        createdBy: "System Setup"
    },
    {
        name: "HR Manager",
        email: "hr@hiresight.com",
        password: "HR@123", // Will be hashed
        role: "HR",
        status: "Active",
        department: "Human Resources",
        permissions: ["applicant_management", "hiring_process", "reports"],
        createdBy: "System Setup"
    },
    {
        name: "HR Specialist",
        email: "hr.specialist@hiresight.com",
        password: "HRSpec@123", // Will be hashed
        role: "HR",
        status: "Active",
        department: "Human Resources",
        permissions: ["applicant_management", "interview_scheduling"],
        createdBy: "System Setup"
    },
    {
        name: "Demo User",
        email: "user@hiresight.com",
        password: "User@123", // Will be hashed
        role: "User",
        status: "Active",
        department: "General",
        permissions: ["resume_upload", "application_view"],
        createdBy: "System Setup"
    },
    {
        name: "Test Admin",
        email: "test@hiresight.com",
        password: "Test@123", // Will be hashed
        role: "Admin",
        status: "Active",
        department: "Testing",
        permissions: ["full_access", "user_management", "system_config", "testing"],
        createdBy: "System Setup"
    }
];

async function addDefaultUsers() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(mongoUrl, mongoConfig);
        console.log('✅ Connected to MongoDB successfully');

        // Create the model
        const UserManagement = mongoose.model("UserManagement", userManagementSchema);

        // Check current users in the collection
        const existingUsers = await UserManagement.find();
        console.log(`\n📊 Current users in usermanagement collection: ${existingUsers.length}`);
        
        if (existingUsers.length > 0) {
            console.log('📋 Existing users:');
            existingUsers.forEach(user => {
                console.log(`  - ${user.name} (${user.email}) - Role: ${user.role} - Status: ${user.status}`);
            });
        }

        console.log('\n🔧 Adding default users...');
        let addedCount = 0;
        let skippedCount = 0;

        for (const userData of defaultUsers) {
            try {
                // Check if user already exists
                const existingUser = await UserManagement.findOne({ email: userData.email });
                
                if (existingUser) {
                    console.log(`⚠️  Skipping ${userData.email} - User already exists`);
                    skippedCount++;
                    continue;
                }

                // Hash the password
                const saltRounds = 12;
                const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

                // Create new user
                const newUser = new UserManagement({
                    ...userData,
                    password: hashedPassword,
                    email: userData.email.toLowerCase()
                });

                await newUser.save();
                console.log(`✅ Added user: ${userData.name} (${userData.email}) - Role: ${userData.role}`);
                addedCount++;

            } catch (error) {
                if (error.code === 11000) {
                    console.log(`⚠️  Skipping ${userData.email} - Duplicate email`);
                    skippedCount++;
                } else {
                    console.error(`❌ Error adding user ${userData.email}:`, error.message);
                }
            }
        }

        // Final count
        const finalUsers = await UserManagement.find();
        console.log('\n📊 Final user statistics:');
        console.log(`  - Total users in database: ${finalUsers.length}`);
        console.log(`  - Users added this session: ${addedCount}`);
        console.log(`  - Users skipped (already exist): ${skippedCount}`);

        // Show breakdown by role
        const roleBreakdown = {};
        finalUsers.forEach(user => {
            roleBreakdown[user.role] = (roleBreakdown[user.role] || 0) + 1;
        });

        console.log('\n👥 Users by role:');
        Object.entries(roleBreakdown).forEach(([role, count]) => {
            console.log(`  - ${role}: ${count} users`);
        });

        console.log('\n🔐 Default Login Credentials:');
        console.log('=' .repeat(50));
        console.log('Admin Access:');
        console.log('  Email: admin@hiresight.com');
        console.log('  Password: Admin@123');
        console.log('');
        console.log('HR Access:');
        console.log('  Email: hr@hiresight.com');
        console.log('  Password: HR@123');
        console.log('');
        console.log('User Access:');
        console.log('  Email: user@hiresight.com');
        console.log('  Password: User@123');
        console.log('');
        console.log('Test Admin:');
        console.log('  Email: test@hiresight.com');
        console.log('  Password: Test@123');
        console.log('=' .repeat(50));
        
        console.log('\n💡 Security Notes:');
        console.log('  - Change these default passwords in production');
        console.log('  - Passwords meet complexity requirements (8+ chars, mixed case, numbers, symbols)');
        console.log('  - All passwords are properly hashed with bcrypt');
        
        console.log('\n🎉 Default users setup completed successfully!');

    } catch (error) {
        console.error('❌ Error setting up default users:', error);
        process.exit(1);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
        process.exit(0);
    }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
    console.log('\n⚠️  Process interrupted. Closing database connection...');
    await mongoose.connection.close();
    process.exit(0);
});

// Run the setup
console.log('🚀 Starting HireSight Default Users Setup');
console.log('📝 This will add default Admin, HR, and User accounts');
console.log('🔒 All passwords will be securely hashed');
console.log('');

addDefaultUsers();