// Debug script to check TikTok data in frontend
console.log('=== TikTok Data Debug ===');

// This script should be run in browser console on the dashboard page
// to see what profile data is being received

if (typeof window !== 'undefined') {
  // Check if we can access the profile data
  console.log('Current profile data:', window.profileData);
  
  // Check localStorage for any cached data
  console.log('LocalStorage auth:', localStorage.getItem('authToken'));
  console.log('LocalStorage user:', localStorage.getItem('user'));
  
  // Check if there are any network requests
  console.log('Check Network tab for /api/influencer/profile calls');
  
  // Instructions
  console.log(`
Instructions:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Paste this script
4. Check the output
5. Also check Network tab for API calls
  `);
}