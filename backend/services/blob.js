const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Upload a buffer to local storage and return the relative URL
async function uploadBufferToBlob(buffer, contentType, suggestedName = 'upload') {
  const safeName = suggestedName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;
  const filePath = path.join(uploadsDir, filename);

  try {
    await fs.promises.writeFile(filePath, buffer);
    // Return a URL that matches the static file serving in app.js
    // Assuming app.js serves 'uploads' folder at '/uploads' path
    const url = `/uploads/${filename}`;
    return { url, key: filename };
  } catch (error) {
    console.error('Error writing file to disk:', error);
    throw new Error('File upload failed');
  }
}

module.exports = { uploadBufferToBlob };
