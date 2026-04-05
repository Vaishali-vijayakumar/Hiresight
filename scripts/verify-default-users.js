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

// Test credentials
const testCredentials = [
    {
        email: "admin@hiresight.com",
        password: "Admin@123",
        expectedRole: "Admin",
        description: "System Administrator"
    },
    {
        email: "hr@hiresight.com", 
        password: "HR@123",
        expectedRole: "HR",
        description: "HR Manager"
    },
    {
        email: "hr.specialist@hiresight.com",
        password: "HRSpec@123",
        expectedRole: "HR", 
        description: "HR Specialist"
    },
    {
        email: "user@hiresight.com",
        password: "User@123",
        expectedRole: "User",
        description: "Demo User"
    },
    {
        email: "test@hiresight.com",
        password: "Test@123",
        expectedRole: "Admin",
        description: "Test Admin"
    }
];

async function verifyLogin(UserManagement, email, password, expectedRole, description) {
    try {
        // Find user
        const user = await UserManagement.findOne({ 
            email: email.toLowerCase()
        });
        
        if (!user) {
            return {
                success: false,
                error: "User not found",
                email,
                description
            };
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return {
                success: false,
                error: "Invalid password",
                email,
                description
            };
        }

        // Check role
        if (user.role !== expectedRole) {
            return {
                success: false,
                error: `Role mismatch. Expected: ${expectedRole}, Found: ${user.role}`,
                email,
                description
            };
        }

        // Check status
        if (user.status !== 'Active') {
            return {
                success: false,
                error: `User status is ${user.status}, expected Active`,
                email,
                description
            };
        }

        return {
            success: true,
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                department: user.department,
                permissions: user.permissions,
                createdBy: user.createdBy,
                createdAt: user.createdAt
            },
            description
        };

    } catch (error) {
        return {
            success: false,
            error: `Database error: ${error.message}`,
            email,
            description
        };
    }
}

async function verifyDefaultUsers() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(mongoUrl, mongoConfig);
        console.log('✅ Connected to MongoDB successfully');

        // Create the model
        const UserManagement = mongoose.model("UserManagement", userManagementSchema);

        console.log('\n🧪 Verifying Default User Login Functionality');
        console.log('=' .repeat(60));

        const results = [];
        let successCount = 0;
        let failCount = 0;

        for (const cred of testCredentials) {
            console.log(`\n🔍 Testing ${cred.description} (${cred.email})`);
            
            const result = await verifyLogin(
                UserManagement, 
                cred.email, 
                cred.password, 
                cred.expectedRole, 
                cred.description
            );
            
            results.push(result);

            if (result.success) {
                console.log(`✅ Login successful`);
                console.log(`   Name: ${result.user.name}`);
                console.log(`   Role: ${result.user.role}`);
                console.log(`   Status: ${result.user.status}`);
                console.log(`   Department: ${result.user.department || 'N/A'}`);
                console.log(`   Permissions: ${result.user.permissions?.join(', ') || 'None'}`);
                successCount++;
            } else {
                console.log(`❌ Login failed: ${result.error}`);
                failCount++;
            }
        }

        // Summary
        console.log('\n' + '=' .repeat(60));
        console.log('📊 VERIFICATION SUMMARY');
        console.log('=' .repeat(60));
        console.log(`✅ Successful logins: ${successCount}/${testCredentials.length}`);
        console.log(`❌ Failed logins: ${failCount}/${testCredentials.length}`);

        if (failCount === 0) {
            console.log('\n🎉 All default users verified successfully!');
            console.log('✅ Database is ready for use');
        } else {
            console.log('\n⚠️  Some login verifications failed');
            console.log('❌ Check the error details above');
        }

        // Show available login options
        console.log('\n🔐 AVAILABLE LOGIN OPTIONS:');
        console.log('=' .repeat(50));
        
        const successfulLogins = results.filter(r => r.success);
        successfulLogins.forEach(result => {
            const cred = testCredentials.find(c => c.email === result.user.email);
            console.log(`${result.user.role} Access:`);
            console.log(`  Name: ${result.user.name}`);
            console.log(`  Email: ${result.user.email}`);
            console.log(`  Password: ${cred.password}`);
            console.log(`  Department: ${result.user.department || 'N/A'}`);
            console.log('');
        });

        console.log('🌐 Access your application at: http://localhost:3000');
        console.log('📱 Use any of the above credentials to login');

        if (failCount > 0) {
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Error verifying default users:', error);
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

// Run the verification
console.log('🔐 Starting Default Users Login Verification');
console.log('🧪 This will test all default user credentials');
console.log('📝 Verifying password hashing and user data integrity');
console.log('');

verifyDefaultUsers();