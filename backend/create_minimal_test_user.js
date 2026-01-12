const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

const db = admin.firestore();

async function createMinimalTestUser() {
  try {
    const testEmail = 'minimal-test@gmail.com';
    const testUserId = 'minimal-test-user-id';
    
    console.log('🔧 Creating minimal test user...');
    
    // Create user in users collection
    await db.collection('users').doc(testUserId).set({
      email: testEmail,
      displayName: 'Minimal Test User',
      createdAt: new Date(),
      isActive: true
    });
    
    console.log('✅ Created user in users collection');
    
    // Create minimal UGC profile with only 1-2 fields
    const minimalProfile = {
      userId: testUserId,
      email: testEmail,
      fullName: 'Minimal Test User',
      // Only fullName is filled, all other required fields are missing
      createdAt: new Date(),
      isActive: true,
      totalProjects: 0,
      completedProjects: 0,
      activeProjects: 0,
      averageRating: 0,
      totalEarnings: 0
    };
    
    await db.collection('ugc_creators').doc(testUserId).set(minimalProfile);
    
    console.log('✅ Created minimal UGC profile');
    console.log('📊 Profile has only fullName filled (1/7 fields = 14%)');
    console.log('🎯 This should definitely show the completion alert!');
    
    console.log('\n📝 Test User Credentials:');
    console.log('Email:', testEmail);
    console.log('User ID:', testUserId);
    console.log('\n🔍 You can now test with this user to see if the alert shows up.');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  }
}

async function addSecondField() {
  try {
    const testUserId = 'minimal-test-user-id';
    
    console.log('🔧 Adding second field (bio) to test user...');
    
    await db.collection('ugc_creators').doc(testUserId).update({
      bio: 'This is a test bio for minimal user'
    });
    
    console.log('✅ Added bio field');
    console.log('📊 Profile now has fullName + bio (2/7 fields = 29%)');
    console.log('🎯 This should still show the completion alert!');
    
  } catch (error) {
    console.error('❌ Error updating test user:', error);
  }
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('add-bio')) {
  addSecondField();
} else {
  createMinimalTestUser();
}