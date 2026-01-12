const { admin, db } = require('./config/firebase');

async function cleanupOrphanedUsers() {
  console.log('🧹 Cleaning up orphaned user accounts...\n');
  
  try {
    // Get all users
    console.log('👥 Getting all users...');
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('✅ No users found - nothing to clean up');
      return;
    }
    
    console.log(`📊 Found ${usersSnapshot.size} users to check\n`);
    
    let adminCount = 0;
    let supportCount = 0;
    let orphanedCount = 0;
    let deletedCount = 0;
    let errorCount = 0;
    
    // Check each user
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      const role = userData.role || 'unknown';
      const email = userData.email || 'no email';
      
      // Preserve admin and support accounts
      if (role === 'admin') {
        adminCount++;
        console.log(`🛡️  Preserving admin: ${email} (ID: ${userId})`);
        continue;
      }
      
      if (role === 'support') {
        supportCount++;
        console.log(`🛡️  Preserving support: ${email} (ID: ${userId})`);
        continue;
      }
      
      // Check if user has corresponding influencer profile
      const influencerDoc = await db.collection('influencers').doc(userId).get();
      
      if (!influencerDoc.exists) {
        // This is an orphaned user account
        orphanedCount++;
        console.log(`🗑️  Deleting orphaned user: ${email} (Role: ${role}, ID: ${userId})`);
        
        try {
          await db.collection('users').doc(userId).delete();
          deletedCount++;
          console.log(`   ✅ Successfully deleted`);
        } catch (error) {
          errorCount++;
          console.error(`   ❌ Error deleting user ${userId}:`, error.message);
        }
      } else {
        console.log(`✅ User has profile: ${email} (Role: ${role}, ID: ${userId})`);
      }
    }
    
    console.log('\n================================================================================');
    console.log('🎉 CLEANUP COMPLETE!');
    console.log(`🛡️  Admin accounts preserved: ${adminCount}`);
    console.log(`🛡️  Support accounts preserved: ${supportCount}`);
    console.log(`🗑️  Orphaned accounts found: ${orphanedCount}`);
    console.log(`✅ Successfully deleted: ${deletedCount}`);
    console.log(`❌ Errors encountered: ${errorCount}`);
    console.log('================================================================================');
    
    // Final verification
    console.log('\n🔍 Final verification...');
    const finalUsersSnapshot = await db.collection('users').get();
    const finalInfluencersSnapshot = await db.collection('influencers').get();
    
    console.log(`📊 Users remaining: ${finalUsersSnapshot.size}`);
    console.log(`📊 Influencers remaining: ${finalInfluencersSnapshot.size}`);
    
    if (finalUsersSnapshot.size > 0) {
      console.log('\n📋 Remaining users:');
      finalUsersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.email} (Role: ${data.role}, ID: ${doc.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

async function verifyDeletion() {
  try {
    console.log('🔍 Verifying database state after deletion...\n');

    // Check influencers collection
    const influencersSnapshot = await db.collection('influencers').get();
    console.log(`📊 Influencers remaining: ${influencersSnapshot.size}`);

    // Check users collection
    const usersSnapshot = await db.collection('users').get();
    console.log(`👥 Users remaining: ${usersSnapshot.size}`);
    
    // Show breakdown by role and emails
    const roleCount = {};
    console.log('\n📧 Remaining user accounts:');
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const role = userData.role || 'unknown';
      roleCount[role] = (roleCount[role] || 0) + 1;
      console.log(`   ${userData.email} (${role}) - Created: ${userData.createdAt}`);
    });
    
    console.log('\n📋 Users by role:');
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });

    // Check for orphaned stats
    let orphanedStats = 0;
    for (const doc of influencersSnapshot.docs) {
      const statsSnapshot = await db.collection('influencers').doc(doc.id).collection('stats').get();
      orphanedStats += statsSnapshot.size;
    }
    
    console.log(`\n📈 Orphaned stats found: ${orphanedStats}`);
    
    console.log('\n✅ Verification complete!');
    console.log('\n💡 Note: If you see "User already exists" errors, it means someone is trying to register with an email that matches one of the remaining accounts above.');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

// Run the verification
verifyDeletion().catch(console.error);