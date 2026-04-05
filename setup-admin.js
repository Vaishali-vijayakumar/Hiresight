const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/hiresight', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Enhanced User Management Schema (same as in app.js)
const userManagementSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        required: true,
        enum: ['User', 'Admin', 'HR', 'Recruiter'],
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

// User Schema (for backward compatibility)
const userSchema = new mongoose.Schema({
    role: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true }
}, { collection: "userdetail" });

const UserManagement = mongoose.model("UserManagement", userManagementSchema);
const User = mongoose.model("User", userSchema);

// Helper function to get default permissions based on role
function getDefaultPermissions(role) {
    const permissions = {
        'Admin': ['all'],
        'HR': ['view_applicants', 'manage_applicants', 'schedule_interviews', 'view_reports'],
        'Recruiter': ['view_applicants', 'update_applicants', 'schedule_interviews'],
        'User': ['view_own_profile', 'upload_resume']
    };
    return permissions[role] || permissions['User'];
}

// Predefined users to create
const initialUsers = [
    {
        name: 'System Administrator',
        email: 'admin@hiresight.com',
        password: 'admin123',
        role: 'Admin',
        department: 'IT',
        createdBy: 'System Setup'
    },
    {
        name: 'HR Manager',
        email: 'hr@hiresight.com',
        password: 'hr123',
        role: 'HR',
        department: 'Human Resources',
        createdBy: 'System Setup'
    },
    {
        name: 'Recruiter Lead',
        email: 'recruiter@hiresight.com',
        password: 'recruiter123',
        role: 'Recruiter',
        department: 'Human Resources',
        createdBy: 'System Setup'
    },
    {
        name: 'Test User',
        email: 'user@hiresight.com',
        password: 'user123',
        role: 'User',
        department: null,
        createdBy: 'System Setup'
    }
];

async function setupInitialUsers() {
    try {
        console.log('🚀 Setting up initial users for HireSight...\n');
        
        // Clear existing users (optional - comment out if you want to keep existing users)
        // await UserManagement.deleteMany({});
        // await User.deleteMany({});
        // console.log('🗑️  Cleared existing users\n');
        
        for (const userData of initialUsers) {
            try {
                // Check if user already exists
                const existingUser = await UserManagement.findOne({ email: userData.email });
                if (existingUser) {
                    console.log(`⚠️  User ${userData.email} already exists. Updating password...`);
                    
                    // Update existing user's password
                    const saltRounds = 12;
                    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
                    
                    await UserManagement.findByIdAndUpdate(existingUser._id, {
                        password: hashedPassword,
                        updatedAt: new Date()
                    });
                    
                    // Also update in User collection
                    await User.findOneAndUpdate(
                        { email: userData.email },
                        { password: hashedPassword },
                        { upsert: true }
                    );
                    
                    console.log(`✅ Updated password for ${userData.name} (${userData.email})`);
                    continue;
                }
                
                // Hash password
                const saltRounds = 12;
                const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
                
                // Create new user in UserManagement
                const newUser = new UserManagement({
                    name: userData.name,
                    email: userData.email,
                    password: hashedPassword,
                    role: userData.role,
                    status: 'Active',
                    department: userData.department,
                    permissions: getDefaultPermissions(userData.role),
                    createdBy: userData.createdBy
                });
                
                await newUser.save();
                
                // Create in User collection for backward compatibility
                const legacyUser = new User({
                    name: userData.name,
                    email: userData.email,
                    password: hashedPassword,
                    role: userData.role
                });
                
                await legacyUser.save();
                
                console.log(`✅ Created ${userData.name} (${userData.email}) - Role: ${userData.role}`);
                
            } catch (userError) {
                console.error(`❌ Error creating user ${userData.email}:`, userError.message);
            }
        }
        
        console.log('\n🎉 Initial user setup completed!\n');
        
        // Display user credentials
        console.log('📋 USER CREDENTIALS:');
        console.log('==========================================');
        initialUsers.forEach(user => {
            console.log(`👤 ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Password: ${user.password}`);
            console.log(`   Role: ${user.role}`);
            console.log('------------------------------------------');
        });
        
        console.log('\n🔐 SECURITY NOTES:');
        console.log('- Change these default passwords immediately after first login');
        console.log('- Use strong passwords with at least 6 characters');
        console.log('- Admin accounts have full system access');
        console.log('- HR and Recruiter accounts have limited access to applicant management');
        
        console.log('\n🌐 ACCESS URLS:');
        console.log('- Login: http://localhost:3000/login.html');
        console.log('- Admin Dashboard: http://localhost:3000/adminhome.html');
        console.log('- HR Dashboard: http://localhost:3000/hrdashboard.html');
        console.log('- User Home: http://localhost:3000/resumehome.html');
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
    } finally {
        mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Run the setup
setupInitialUsers();