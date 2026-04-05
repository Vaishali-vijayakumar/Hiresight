const mongoose = require('mongoose');

// MongoDB connection
const mongoUrl = "mongodb://localhost:27017/hiresight";

async function verifyDataClearing() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(mongoUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connected to MongoDB');

        // Get database connection
        const db = mongoose.connection.db;

        // Count remaining documents
        console.log('\n📊 Current data counts after clearing:');
        
        const hiringCount = await db.collection('hiring').countDocuments();
        const applicantsCount = await db.collection('applicants').countDocuments();
        const adminTransferCount = await db.collection('adminHRTransfers').countDocuments();
        const analyticsCount = await db.collection('analytics').countDocuments();
        const usermanagementCount = await db.collection('usermanagement').countDocuments();

        console.log(`   - Hiring records: ${hiringCount}`);
        console.log(`   - Applicant records: ${applicantsCount}`);
        console.log(`   - Admin transfer records: ${adminTransferCount}`);
        console.log(`   - Analytics records: ${analyticsCount}`);
        console.log(`   - User management records: ${usermanagementCount} (preserved)`);

        // Verification
        const adminDataRemoved = (hiringCount === 0 && applicantsCount === 0 && analyticsCount === 0);
        const transferDataRemoved = (adminTransferCount === 0);

        console.log('\n✅ Verification Results:');
        console.log(`   - Admin Dashboard data cleared: ${adminDataRemoved ? '✅ YES' : '❌ NO'}`);
        console.log(`   - Admin Transfer data cleared: ${transferDataRemoved ? '✅ YES' : '❌ NO'}`);
        
        if (adminDataRemoved && transferDataRemoved) {
            console.log('\n🎉 SUCCESS: All admin dashboard and transfer data has been successfully removed!');
        } else {
            console.log('\n⚠️  WARNING: Some data may still exist. Please check manually.');
        }

    } catch (error) {
        console.error('❌ Error verifying data:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
        process.exit(0);
    }
}

// Run the verification
verifyDataClearing();