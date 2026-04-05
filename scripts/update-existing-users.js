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

// Users to update with new passwords
const passwordUpdates = [
    {
        email: "admin@hiresight.com",
        newPassword: "Admin@123"
    },
    {
        email: "hr@hiresight.com",
        newPassword: "HR@123"
    },
    {
        email: "user@hiresight.com",
        newPassword: "User@123"
    }
];

async function updateUserPasswords() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(mongoUrl, mongoConfig);
        console.log('✅ Connected to MongoDB successfully');

        // Create the model
        const UserManagement = mongoose.model("UserManagement", userManagementSchema);

        console.log('\n📊 Current users in database:');
        const allUsers = await UserManagement.find();
        allUsers.forEach(user => {
            console.log(`  - ${user.name} (${user.email}) - Role: ${user.role} - Status: ${user.status}`);
        });

        console.log('\n🔧 Updating passwords for existing users...');
        let updatedCount = 0;
        let notFoundCount = 0;

        for (const update of passwordUpdates) {
            try {
                // Find the user
                const user = await UserManagement.findOne({ email: update.email.toLowerCase() });
                
                if (!user) {
                    console.log(`⚠️  User ${update.email} not found - skipping`);
                    notFoundCount++;
                    continue;
                }

                // Hash the new password
                const saltRounds = 12;
                const hashedPassword = await bcrypt.hash(update.newPassword, saltRounds);

                // Update the user
                await UserManagement.findOneAndUpdate(
                    { email: update.email.toLowerCase() },
                    { 
                        password: hashedPassword,
                        updatedAt: new Date(),
                        loginAttempts: 0, // Reset login attempts
                        lockUntil: null   // Clear any locks
                    }
                );

                console.log(`✅ Updated password for ${user.name} (${update.email})`);
                updatedCount++;

            } catch (error) {
                console.error(`❌ Error updating ${update.email}:`, error.message);
            }
        }

        console.log('\n📊 Update Summary:');
        console.log(`  - Passwords updated: ${updatedCount}`);
        console.log(`  - Users not found: ${notFoundCount}`);

        // Show all current login credentials
        console.log('\n🔐 UPDATED LOGIN CREDENTIALS:');
        console.log('=' .repeat(50));
        
        // Get fresh user data after updates
        const updatedUsers = await UserManagement.find({ status: 'Active' });
        
        const loginMap = {
            'admin@hiresight.com': 'Admin@123',
            'hr@hiresight.com': 'HR@123', 
            'user@hiresight.com': 'User@123',
            'hr.specialist@hiresight.com': 'HRSpec@123',
            'test@hiresight.com': 'Test@123'
        };

        updatedUsers.forEach(user => {
            const password = loginMap[user.email] || 'Password not set by this script';
            console.log(`${user.role} - ${user.name}:`);
            console.log(`  Email: ${user.email}`);
            console.log(`  Password: ${password}`);
            console.log(`  Department: ${user.department || 'N/A'}`);
            console.log('');
        });

        console.log('🎉 Password updates completed successfully!');
        console.log('🌐 You can now login at: http://localhost:3000');

    } catch (error) {
        console.error('❌ Error updating user passwords:', error);
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

// Run the update
console.log('🔐 Updating Existing User Passwords');
console.log('🔧 Setting standard passwords for existing users');
console.log('📝 This will update passwords to match default credentials');
console.log('');

updateUserPasswords();