// Debug script to check frontend authentication and profile state
// Run this in browser console on the dashboard page

console.log('=== FRONTEND PROFILE DEBUG ===');

// Check localStorage for authentication data
console.log('\n1. LocalStorage Data:');
const authToken = localStorage.getItem('authToken');
const userData = localStorage.getItem('userData');
const userProfile = localStorage.getItem('userProfile');

console.log('Auth Token:', authToken ? 'EXISTS' : 'MISSING');
console.log('User Data:', userData ? JSON.parse(userData) : 'MISSING');
console.log('User Profile:', userProfile ? JSON.parse(userProfile) : 'MISSING');

// Check sessionStorage
console.log('\n2. SessionStorage Data:');
const sessionAuth = sessionStorage.getItem('authToken');
const sessionUser = sessionStorage.getItem('userData');
console.log('Session Auth Token:', sessionAuth ? 'EXISTS' : 'MISSING');
console.log('Session User Data:', sessionUser ? JSON.parse(sessionUser) : 'MISSING');

// Check Firebase Auth state
console.log('\n3. Firebase Auth State:');
if (window.firebase && window.firebase.auth) {
  const currentUser = window.firebase.auth().currentUser;
  console.log('Firebase Current User:', currentUser ? {
    uid: currentUser.uid,
    email: currentUser.email,
    displayName: currentUser.displayName
  } : 'NOT AUTHENTICATED');
} else {
  console.log('Firebase not available in window');
}

// Check React Auth Context (if available)
console.log('\n4. React Auth Context:');
// This will only work if we can access the React context
try {
  const reactFiberNode = document.querySelector('#root')._reactInternalFiber || 
                        document.querySelector('#root')._reactInternalInstance;
  console.log('React Fiber Node:', reactFiberNode ? 'FOUND' : 'NOT FOUND');
} catch (e) {
  console.log('Cannot access React internals:', e.message);
}

// Check current URL and route
console.log('\n5. Current Route:');
console.log('URL:', window.location.href);
console.log('Pathname:', window.location.pathname);
console.log('Hash:', window.location.hash);

// Check for any error messages in the DOM
console.log('\n6. DOM Error Messages:');
const errorElements = document.querySelectorAll('.alert-danger, .error, [class*="error"]');
errorElements.forEach((el, index) => {
  console.log(`Error ${index + 1}:`, el.textContent.trim());
});

// Check for profile completion messages
const profileMessages = document.querySelectorAll('.alert-warning, [class*="profile"], [class*="onboard"]');
profileMessages.forEach((el, index) => {
  console.log(`Profile Message ${index + 1}:`, el.textContent.trim());
});

console.log('\n=== END DEBUG ===');