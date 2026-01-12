const path = require('path');
const fs = require('fs');

let admin;
let db;
let auth;
let isConfigured = false;

// Explicit switch to disable Firebase regardless of local credentials
const DISABLE = String(process.env.DISABLE_FIREBASE || '').toLowerCase() === 'true';

// If service account is available and not disabled, initialize Firebase; otherwise, export harmless mocks.
const hasEnvSA = !!process.env.FIREBASE_SERVICE_ACCOUNT;
const localSAPath = path.join(__dirname, 'serviceAccount.json');
let hasLocalSA = fs.existsSync(localSAPath);

if (!DISABLE && (hasEnvSA || hasLocalSA)) {
  admin = require('firebase-admin');
  const serviceAccount = hasEnvSA ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : require('./serviceAccount.json');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
  } else {
    admin.app();
  }
  db = admin.firestore();
  db.settings({ ignoreUndefinedProperties: true });
  auth = admin.auth();
  isConfigured = true;
} else {
  // Lightweight mocks to avoid crashes when Firebase is not configured
  admin = {
    apps: [],
    auth() { return { verifyIdToken: async () => { throw new Error('Firebase disabled'); } }; },
    credential: { cert: () => ({}) },
    initializeApp: () => {}
  };
  db = {
    collection: () => ({ doc: () => ({ get: async () => { throw new Error('Firebase disabled'); } }) })
  };
  auth = admin.auth();
}
module.exports = { admin, db, auth, isConfigured };
