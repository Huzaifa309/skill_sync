const fs = require('fs');
const path = require('path');

// Define paths
const publicPath = path.join(__dirname, 'public');
const buildPath = path.join(__dirname, 'backend', 'build', 'static');

// Ensure build/static directory exists
if (!fs.existsSync(buildPath)) {
    fs.mkdirSync(buildPath, { recursive: true });
}

// Copy skills.txt
fs.copyFileSync(
    path.join(publicPath, 'skills.txt'),
    path.join(buildPath, 'skills.txt')
);

console.log('Static files copied successfully!'); 