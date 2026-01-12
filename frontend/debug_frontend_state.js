// Debug script to check frontend state
console.log('=== Frontend Debug Script ===');

// Check localStorage
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');

console.log('Token exists:', !!token);
console.log('Token length:', token ? token.length : 0);
console.log('User exists:', !!user);

if (user) {
    try {
        const parsedUser = JSON.parse(user);
        console.log('User UID:', parsedUser.uid);
        console.log('User Email:', parsedUser.email);
        console.log('User Role:', parsedUser.role);
        console.log('Instagram Username:', parsedUser.instagramUsername || 'Not set');
    } catch (e) {
        console.log('Error parsing user:', e.message);
    }
}

// Test API call if we have auth data
if (token && user) {
    const parsedUser = JSON.parse(user);
    
    // Test the profile API
    console.log('\n=== Testing Profile API ===');
    fetch(`http://localhost:5000/api/influencer/${parsedUser.uid}/profile`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('Profile API Status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Profile API Response:', data);
        console.log('Profile Instagram Username:', data.profile?.instagramUsername);
    })
    .catch(error => {
        console.log('Profile API Error:', error.message);
    });
    
    // Test the Instagram detailed API
    console.log('\n=== Testing Instagram Detailed API ===');
    fetch(`http://localhost:5000/api/influencer/${parsedUser.uid}/instagram/detailed`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('Instagram API Status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Instagram API Response:', data);
        console.log('Profile Username:', data.profile?.username);
        console.log('Reels Count:', data.reels?.length);
    })
    .catch(error => {
        console.log('Instagram API Error:', error.message);
    });
} else {
    console.log('\n=== Setting Valid Auth Data ===');
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJzeDhncXhmU05aUXZsSFhxN0JRSSIsImVtYWlsIjoibXVoYW1tYWQuc2hhaHphaWJAdGFtYXRvcy5jb20iLCJyb2xlIjoiaW5mbHVlbmNlciIsImlhdCI6MTc2MTY0MDg0NSwiZXhwIjoxNzYyMjQ1NjQ1fQ.Yl9peygFe41s8Iz2VANSlMvGAYF31tAvKz_S6EflzZU';
    const userData = {
        uid: 'sx8gqxfSNZQvlHXq7BQI',
        email: 'muhammad.shahzaib@tamatos.com',
        role: 'influencer',
        instagramUsername: 'laibybaby'
    };
    
    localStorage.setItem('token', validToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    console.log('Auth data set! Please refresh the page.');
}