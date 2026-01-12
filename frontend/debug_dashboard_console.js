// Debug script to check dashboard console logs
// This script will help us understand what's happening in the browser console

console.log('=== DASHBOARD DEBUG SCRIPT ===');

// Check if we're on the dashboard page
if (window.location.pathname.includes('/dashboard')) {
  console.log('On dashboard page');
  
  // Wait for React to load and check for profile data
  setTimeout(() => {
    // Try to find profile data in React component state
    const reactRoot = document.querySelector('#root');
    if (reactRoot && reactRoot._reactInternalFiber) {
      console.log('React root found');
    }
    
    // Check localStorage for user data
    const userData = localStorage.getItem('user');
    console.log('User data from localStorage:', userData);
    
    // Check for any profile data in window object
    console.log('Window object keys:', Object.keys(window));
    
    // Look for any Instagram-related data
    const instagramElements = document.querySelectorAll('[class*="instagram"], [id*="instagram"]');
    console.log('Instagram elements found:', instagramElements.length);
    
    // Check for "Not Connected" text
    const notConnectedElements = document.querySelectorAll('*');
    const notConnectedTexts = Array.from(notConnectedElements).filter(el => 
      el.textContent && el.textContent.includes('Not Connected')
    );
    console.log('Not Connected elements:', notConnectedTexts.length);
    notConnectedTexts.forEach(el => console.log('Not Connected element:', el.textContent));
    
  }, 2000);
  
  // Monitor network requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    console.log('Fetch request:', args[0]);
    return originalFetch.apply(this, args).then(response => {
      console.log('Fetch response:', response.status, response.url);
      return response;
    });
  };
  
} else {
  console.log('Not on dashboard page, current path:', window.location.pathname);
}