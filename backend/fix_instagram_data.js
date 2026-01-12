require('dotenv').config();
const { admin, db } = require('./config/firebase');

function cleanObject(obj) {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanObject(item)).filter(item => item !== null && item !== undefined);
  }
  
  if (typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        const cleanedValue = cleanObject(value);
        if (cleanedValue !== null && cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
    }
    return cleaned;
  }
  
  return obj;
}

async function fixInstagramData() {
  try {
    console.log('🔧 Fixing Instagram data by removing undefined values...');
    
    const userId = '0ZPlyBVkHGHUEPRcxB2I';
    
    // Get the Instagram data
    const instagramDoc = await db.collection('instagramDetailedData').doc(userId).get();
    
    if (!instagramDoc.exists) {
      console.log('❌ No Instagram data found');
      return;
    }
    
    const data = instagramDoc.data();
    console.log('✅ Instagram data found');
    console.log('Posts count:', data.posts?.length || 0);
    console.log('Reels count:', data.reels?.length || 0);
    
    // Clean the data
    const cleanedData = cleanObject(data);
    
    console.log('🧹 Cleaning data...');
    console.log('Cleaned posts count:', cleanedData.posts?.length || 0);
    console.log('Cleaned reels count:', cleanedData.reels?.length || 0);
    
    // Update the document with cleaned data
    await db.collection('instagramDetailedData').doc(userId).set(cleanedData);
    
    console.log('✅ Instagram data cleaned and updated successfully');
    console.log('🎉 The endpoint should now work properly!');
    
  } catch (error) {
    console.error('❌ Error fixing Instagram data:', error.message);
  }
  
  process.exit(0);
}

fixInstagramData();