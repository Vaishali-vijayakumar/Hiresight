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

async function finalCleanup() {
    try {
        console.log('🔗 Connecting to MongoDB for final cleanup check...');
        await mongoose.connect(mongoUrl, mongoConfig);
        console.log('✅ Connected to MongoDB successfully');

        // Get database instance
        const db = mongoose.connection.db;
        
        // List all collections
        const collections = await db.listCollections().toArray();
        console.log('\n📋 All collections in database:');
        
        const preserveCollections = ['usermanagement'];
        const additionalCollectionsFound = [];
        
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`  - ${col.name}: ${count} documents`);
            
            if (!preserveCollections.includes(col.name) && count > 0) {
                additionalCollectionsFound.push(col.name);
            }
        }

        // Clear any additional collections found (except usermanagement)
        if (additionalCollectionsFound.length > 0) {
            console.log('\n🧹 Found additional collections with data to clear:');
            for (const collectionName of additionalCollectionsFound) {
                console.log(`\n🗑️  Clearing ${collectionName}...`);
                const result = await db.collection(collectionName).deleteMany({});
                console.log(`✅ Cleared ${result.deletedCount} documents from ${collectionName}`);
            }
        } else {
            console.log('\n✅ No additional collections with data found.');
        }

        console.log('\n📊 Final status:');
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            const status = col.name === 'usermanagement' ? '(PRESERVED ✅)' : 
                          count === 0 ? '(CLEARED ✅)' : '(HAS DATA ⚠️)';
            console.log(`  - ${col.name}: ${count} documents ${status}`);
        }
        
    } catch (error) {
        console.error('❌ Final cleanup failed:', error);
        process.exit(1);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
        process.exit(0);
    }
}

// Run the final cleanup
console.log('🔍 Running final database cleanup check');
console.log('🔒 Preserving usermanagement collection only');
console.log('');

finalCleanup();