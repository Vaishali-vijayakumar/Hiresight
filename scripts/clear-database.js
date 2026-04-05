const mongoose = require('mongoose');

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

async function clearDatabase() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(mongoUrl, mongoConfig);
        console.log('✅ Connected to MongoDB successfully');

        // Get database instance
        const db = mongoose.connection.db;
        
        // List all collections
        const collections = await db.listCollections().toArray();
        console.log('\n📋 Found collections:');
        collections.forEach(col => {
            console.log(`  - ${col.name}`);
        });

        // Collections to preserve (keep usermanagement data)
        const preserveCollections = ['usermanagement'];
        
        // Collections to clear completely
        const collectionsToCheck = [
            'applicants',
            'hiring', 
            'resumes',
            'adminHRTransfers',
            'analytics',
            'userdetail',
            'sessions'
        ];

        console.log('\n🗑️  Starting database cleanup...');
        
        // Count documents before clearing for confirmation
        console.log('\n📊 Current document counts:');
        for (const collectionName of collectionsToCheck) {
            try {
                const count = await db.collection(collectionName).countDocuments();
                console.log(`  - ${collectionName}: ${count} documents`);
            } catch (error) {
                console.log(`  - ${collectionName}: Collection doesn't exist`);
            }
        }

        // Show usermanagement count (to preserve)
        try {
            const userMgmtCount = await db.collection('usermanagement').countDocuments();
            console.log(`  - usermanagement: ${userMgmtCount} documents (PRESERVING)`);
        } catch (error) {
            console.log(`  - usermanagement: Collection doesn't exist`);
        }

        // Clear each collection
        let clearedCount = 0;
        for (const collectionName of collectionsToCheck) {
            try {
                console.log(`\n🧹 Clearing ${collectionName}...`);
                const result = await db.collection(collectionName).deleteMany({});
                console.log(`✅ Cleared ${result.deletedCount} documents from ${collectionName}`);
                clearedCount++;
            } catch (error) {
                if (error.message.includes('ns not found')) {
                    console.log(`⚠️  Collection ${collectionName} doesn't exist - skipping`);
                } else {
                    console.error(`❌ Error clearing ${collectionName}:`, error.message);
                }
            }
        }

        console.log('\n📊 Final document counts:');
        for (const collectionName of collectionsToCheck) {
            try {
                const count = await db.collection(collectionName).countDocuments();
                console.log(`  - ${collectionName}: ${count} documents`);
            } catch (error) {
                console.log(`  - ${collectionName}: Collection doesn't exist`);
            }
        }

        // Verify usermanagement is still intact
        try {
            const userMgmtCount = await db.collection('usermanagement').countDocuments();
            console.log(`  - usermanagement: ${userMgmtCount} documents (PRESERVED ✅)`);
        } catch (error) {
            console.log(`  - usermanagement: Collection doesn't exist`);
        }

        console.log(`\n🎉 Database cleanup completed! Cleared ${clearedCount} collections while preserving usermanagement data.`);
        
    } catch (error) {
        console.error('❌ Database cleanup failed:', error);
        process.exit(1);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
        process.exit(0);
    }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
    console.log('\n⚠️  Process interrupted. Closing database connection...');
    await mongoose.connection.close();
    process.exit(0);
});

// Run the cleanup
console.log('🚀 Starting HireSight Database Cleanup');
console.log('⚠️  This will remove all data EXCEPT from usermanagement collection');
console.log('📝 Collections to be cleared: applicants, hiring, resumes, adminHRTransfers, analytics, userdetail, sessions');
console.log('🔒 Collections to be preserved: usermanagement');
console.log('');

clearDatabase();