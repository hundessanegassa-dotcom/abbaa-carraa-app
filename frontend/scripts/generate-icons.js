// scripts/generate-icons.js - Run with: node scripts/generate-icons.js
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconDir = path.join(process.cwd(), 'public', 'icons');

// Create directory if it doesn't exist
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Create a simple SVG template for each size
sizes.forEach(size => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
    <rect width="100" height="100" rx="20" fill="#10b981"/>
    <text x="50" y="68" font-size="50" text-anchor="middle" fill="white">🎁</text>
    <text x="50" y="88" font-size="14" text-anchor="middle" fill="white" font-weight="bold">AC</text>
  </svg>`;
  
  const filename = path.join(iconDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Created: ${filename}`);
});

console.log('All icons created!');
