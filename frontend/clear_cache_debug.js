// Script to clear all cached data and force fresh data load
console.log('=== CLEARING ALL CACHE ===');

// Clear localStorage
localStorage.clear();
console.log('localStorage cleared');

// Clear sessionStorage
sessionStorage.clear();
console.log('sessionStorage cleared');

// Clear browser cache (if possible)
if ('caches' in window) {
  caches.keys().then(function(names) {
    for (let name of names) {
      caches.delete(name);
    }
    console.log('Browser caches cleared');
  });
}

// Force reload without cache
console.log('Forcing hard reload...');
window.location.reload(true);