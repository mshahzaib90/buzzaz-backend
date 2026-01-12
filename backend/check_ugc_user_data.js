const { admin, db } = require('./config/firebase');

async function checkUGCUserData() {
    try {
        console.log('🔍 Checking Firebase data for UGC user: ugc@gmailc.om');
        console.log('=' .repeat(60));

        // First, check in users collection
        console.log('\n📋 Checking users collection...');
        const usersSnapshot = await db.collection('users').get();
        let targetUser = null;
        
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            if (userData.email === 'ugc@gmailc.om' || userData.email === 'ugc@gmail.com') {
                targetUser = { id: doc.id, ...userData };
                console.log('✅ Found user in users collection:');
                console.log('User ID:', doc.id);
                console.log('Email:', userData.email);
                console.log('Display Name:', userData.displayName || 'Not set');
                console.log('Created At:', userData.createdAt || 'Not set');
                console.log('User Type:', userData.userType || 'Not set');
                console.log('Full user data:', JSON.stringify(userData, null, 2));
            }
        });

        if (!targetUser) {
            console.log('❌ User not found in users collection');
            
            // List all users to see what's available
            console.log('\n📋 Available users in collection:');
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                console.log(`- ${doc.id}: ${userData.email || 'No email'} (${userData.displayName || 'No name'})`);
            });
        }

        // Check in ugc_creators collection
        console.log('\n📋 Checking ugc_creators collection...');
        const ugcSnapshot = await db.collection('ugc_creators').get();
        let ugcProfile = null;

        ugcSnapshot.forEach(doc => {
            const ugcData = doc.data();
            if (targetUser && doc.id === targetUser.id) {
                ugcProfile = { id: doc.id, ...ugcData };
                console.log('✅ Found UGC profile:');
                console.log('Profile ID:', doc.id);
                console.log('Full UGC profile data:', JSON.stringify(ugcData, null, 2));
            } else if (ugcData.email === 'ugc@gmailc.om' || ugcData.email === 'ugc@gmail.com') {
                ugcProfile = { id: doc.id, ...ugcData };
                console.log('✅ Found UGC profile by email:');
                console.log('Profile ID:', doc.id);
                console.log('Full UGC profile data:', JSON.stringify(ugcData, null, 2));
            }
        });

        if (!ugcProfile) {
            console.log('❌ UGC profile not found');
            
            // List all UGC creators
            console.log('\n📋 Available UGC creators:');
            ugcSnapshot.forEach(doc => {
                const ugcData = doc.data();
                console.log(`- ${doc.id}: ${ugcData.email || 'No email'} (${ugcData.fullName || 'No name'})`);
            });
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 SUMMARY:');
        console.log('User found:', targetUser ? '✅ Yes' : '❌ No');
        console.log('UGC Profile found:', ugcProfile ? '✅ Yes' : '❌ No');
        
        if (ugcProfile) {
            console.log('\n🎯 UGC Profile Fields Status:');
            const fields = [
                'fullName', 'phoneNumber', 'location', 'city', 'country', 
                'dateOfBirth', 'gender', 'maritalStatus', 'children', 'bio',
                'sampleContent', 'niche', 'contentStyle', 'pricing', 'portfolio'
            ];
            
            fields.forEach(field => {
                const value = ugcProfile[field];
                const status = value && value !== '' && value !== 'Not set' ? '✅' : '❌';
                console.log(`${status} ${field}: ${value || 'Not set'}`);
            });
        }

    } catch (error) {
        console.error('❌ Error checking UGC user data:', error);
    } finally {
        process.exit(0);
    }
}

checkUGCUserData();