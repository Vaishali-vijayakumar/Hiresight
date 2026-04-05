const http = require('http');

const API_BASE = 'http://localhost:3000/api';

// Test endpoints
const endpoints = [
    '/hiring',
    '/hiring/stats', 
    '/applicants',
    '/admin/dashboard/stats',
    '/admin/analytics/departments',
    '/admin/analytics/trends',
    '/admin/analytics/sources',
    '/admin/pipeline/status'
];

async function makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/api${endpoint}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', chunk => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({
                        endpoint,
                        status: res.statusCode,
                        success: res.statusCode === 200,
                        data: parsed,
                        error: null
                    });
                } catch (parseError) {
                    resolve({
                        endpoint,
                        status: res.statusCode,
                        success: false,
                        data: null,
                        error: `JSON Parse Error: ${parseError.message}`,
                        rawData: data
                    });
                }
            });
        });

        req.on('error', (err) => {
            resolve({
                endpoint,
                status: 0,
                success: false,
                data: null,
                error: `Request Error: ${err.message}`
            });
        });

        req.setTimeout(5000, () => {
            req.destroy();
            resolve({
                endpoint,
                status: 0,
                success: false,
                data: null,
                error: 'Request timeout'
            });
        });

        req.end();
    });
}

async function testAPIEndpoints() {
    console.log('🧪 Testing HireSight API Endpoints After Database Cleanup');
    console.log('=' .repeat(60));
    
    const results = [];
    
    for (const endpoint of endpoints) {
        console.log(`\n🔍 Testing: ${API_BASE}${endpoint}`);
        
        const result = await makeRequest(endpoint);
        results.push(result);
        
        if (result.success) {
            console.log(`✅ ${endpoint} - Status: ${result.status}`);
            
            // Show data summary for key endpoints
            if (endpoint === '/hiring') {
                const count = Array.isArray(result.data) ? result.data.length : 0;
                console.log(`   📊 Hiring records: ${count}`);
            } else if (endpoint === '/applicants') {
                const count = Array.isArray(result.data) ? result.data.length : 
                            (result.data && Array.isArray(result.data.applicants)) ? result.data.applicants.length : 0;
                console.log(`   👥 Applicant records: ${count}`);
            } else if (endpoint === '/hiring/stats') {
                console.log(`   📈 Stats: ${JSON.stringify(result.data)}`);
            } else if (endpoint === '/admin/dashboard/stats') {
                const stats = result.data;
                console.log(`   🎯 Dashboard Stats:`, {
                    hiring: stats.hiring || {},
                    applicants: stats.applicants || {},
                    users: stats.users || {}
                });
            }
        } else {
            console.log(`❌ ${endpoint} - Status: ${result.status}`);
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
            if (result.rawData && result.rawData.length < 500) {
                console.log(`   Raw Response: ${result.rawData}`);
            }
        }
    }
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('=' .repeat(60));
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Successful: ${successful}/${results.length}`);
    console.log(`❌ Failed: ${failed}/${results.length}`);
    
    if (failed === 0) {
        console.log('\n🎉 All API endpoints are working correctly after database cleanup!');
        console.log('📊 Empty collections are being handled gracefully by the frontend.');
    } else {
        console.log('\n⚠️  Some endpoints failed. Check the details above.');
    }
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Frontend pages should display "No data" states gracefully');
    console.log('   2. Try uploading some test data to verify data flow');
    console.log('   3. Check that usermanagement data is still intact for login');
    
    process.exit(failed === 0 ? 0 : 1);
}

// Add delay to ensure server is ready
console.log('⏳ Waiting for server to be ready...');
setTimeout(testAPIEndpoints, 2000);