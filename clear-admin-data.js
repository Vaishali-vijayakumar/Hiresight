const mongoose = require('mongoose');

// MongoDB connection
const mongoUrl = "mongodb://localhost:27017/hiresight";

async function clearAdminData() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(mongoUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connected to MongoDB');

        // Get database connection
        const db = mongoose.connection.db;

        // Count documents before deletion
        console.log('\n📊 Current data counts:');
        const hiringCount = await db.collection('hiring').countDocuments();
        const applicantsCount = await db.collection('applicants').countDocuments();
        const adminTransferCount = await db.collection('adminHRTransfers').countDocuments();
        const analyticsCount = await db.collection('analytics').countDocuments();

        console.log(`   - Hiring records: ${hiringCount}`);
        console.log(`   - Applicant records: ${applicantsCount}`);
        console.log(`   - Admin transfer records: ${adminTransferCount}`);
        console.log(`   - Analytics records: ${analyticsCount}`);

        // Clear Admin Dashboard related collections
        console.log('\n🗑️  Clearing Admin Dashboard data...');
        
        // Clear hiring collection (job postings)
        const hiringResult = await db.collection('hiring').deleteMany({});
        console.log(`   ✅ Deleted ${hiringResult.deletedCount} hiring records`);

        // Clear applicants collection 
        const applicantsResult = await db.collection('applicants').deleteMany({});
        console.log(`   ✅ Deleted ${applicantsResult.deletedCount} applicant records`);

        // Clear analytics collection
        const analyticsResult = await db.collection('analytics').deleteMany({});
        console.log(`   ✅ Deleted ${analyticsResult.deletedCount} analytics records`);

        // Clear Admin Transfer related collections
        console.log('\n🔄 Clearing Admin Transfer data...');
        
        // Clear adminHRTransfers collection
        const transferResult = await db.collection('adminHRTransfers').deleteMany({});
        console.log(`   ✅ Deleted ${transferResult.deletedCount} admin transfer records`);

        // Summary
        console.log('\n📋 Summary of deleted data:');
        console.log(`   - Admin Dashboard data: ${hiringResult.deletedCount + applicantsResult.deletedCount + analyticsResult.deletedCount} records`);
        console.log(`   - Admin Transfer data: ${transferResult.deletedCount} records`);
        console.log(`   - Total deleted: ${hiringResult.deletedCount + applicantsResult.deletedCount + analyticsResult.deletedCount + transferResult.deletedCount} records`);

        console.log('\n✅ Data clearing completed successfully!');

    } catch (error) {
        console.error('❌ Error clearing data:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
        process.exit(0);
    }
}

// Run the script
clearAdminData();