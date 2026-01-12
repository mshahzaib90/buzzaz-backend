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

async function testProfileCompletion() {
  try {
    const email = 'ugc@gmailc.om';
    
    console.log('🔍 Testing Profile Completion Logic...');
    console.log('Target email:', email);
    
    // Find user in users collection
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('❌ User not found in users collection');
      return;
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    console.log('✅ Found user with ID:', userId);
    
    // Get UGC profile
    const ugcProfileRef = db.collection('ugc_creators').doc(userId);
    const ugcProfileDoc = await ugcProfileRef.get();
    
    if (!ugcProfileDoc.exists) {
      console.log('❌ UGC profile not found');
      return;
    }
    
    const profile = ugcProfileDoc.data();
    console.log('✅ Found UGC profile');
    
    // Test the completion logic (same as frontend)
    const allRequiredFields = [
      'fullName',
      'bio', 
      'location',
      'reelPostPrice',
      'staticPostPrice',
      'niche',
      'contentStyle'
    ];
    
    let completedFields = 0;
    const fieldStatus = {};
    
    // Check basic required fields
    allRequiredFields.forEach(field => {
      if (field === 'niche') {
        const isComplete = profile.niche && profile.niche.length > 0;
        fieldStatus[field] = { value: profile.niche, isComplete };
        if (isComplete) completedFields++;
      } else if (field === 'contentStyle') {
        const isComplete = profile.contentStyle && profile.contentStyle.length > 0;
        fieldStatus[field] = { value: profile.contentStyle, isComplete };
        if (isComplete) completedFields++;
      } else {
        const isComplete = profile[field] && profile[field].toString().trim() !== '';
        fieldStatus[field] = { value: profile[field], isComplete };
        if (isComplete) completedFields++;
      }
    });
    
    const percentage = Math.round((completedFields / allRequiredFields.length) * 100);
    
    console.log('\n📊 COMPLETION ANALYSIS:');
    console.log('Field Status:', fieldStatus);
    console.log(`Completed fields: ${completedFields}/${allRequiredFields.length}`);
    console.log(`Completion percentage: ${percentage}%`);
    console.log(`Should show alert: ${percentage < 100 ? 'YES' : 'NO'}`);
    
    // Test with different field combinations
    console.log('\n🧪 TESTING DIFFERENT SCENARIOS:');
    
    // Scenario 1: Only 1 field filled
    const scenario1 = { fullName: 'Test User' };
    const result1 = calculateCompletion(scenario1, allRequiredFields);
    console.log(`1 field filled: ${result1.percentage}% - Should show: ${result1.percentage < 100 ? 'YES' : 'NO'}`);
    
    // Scenario 2: Only 2 fields filled
    const scenario2 = { fullName: 'Test User', bio: 'Test bio' };
    const result2 = calculateCompletion(scenario2, allRequiredFields);
    console.log(`2 fields filled: ${result2.percentage}% - Should show: ${result2.percentage < 100 ? 'YES' : 'NO'}`);
    
    // Scenario 3: 5 fields filled (current user)
    const scenario3 = { 
      fullName: 'Test User', 
      bio: 'Test bio', 
      location: 'Test location',
      niche: ['Fashion'],
      contentStyle: ['Demo']
    };
    const result3 = calculateCompletion(scenario3, allRequiredFields);
    console.log(`5 fields filled: ${result3.percentage}% - Should show: ${result3.percentage < 100 ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

function calculateCompletion(profile, allRequiredFields) {
  let completedFields = 0;
  
  allRequiredFields.forEach(field => {
    if (field === 'niche') {
      const isComplete = profile.niche && profile.niche.length > 0;
      if (isComplete) completedFields++;
    } else if (field === 'contentStyle') {
      const isComplete = profile.contentStyle && profile.contentStyle.length > 0;
      if (isComplete) completedFields++;
    } else {
      const isComplete = profile[field] && profile[field].toString().trim() !== '';
      if (isComplete) completedFields++;
    }
  });
  
  const percentage = Math.round((completedFields / allRequiredFields.length) * 100);
  return { completedFields, percentage };
}

testProfileCompletion();