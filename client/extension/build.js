#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Building AgentShield Chrome Extension...');

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Core extension files will be copied after Vite build

// Build popup with Vite
console.log('🎨 Building popup UI with Vite...');
try {
  execSync('npm run build', { 
    cwd: path.join(__dirname, 'popup'),
    stdio: 'inherit'
  });
} catch (error) {
  console.error('❌ Failed to build popup:', error.message);
  process.exit(1);
}

// Copy core extension files AFTER Vite build
console.log('📋 Copying manifest.json...');
fs.copyFileSync(
  path.join(__dirname, 'manifest.json'),
  path.join(distDir, 'manifest.json')
);

console.log('⚙️ Copying background.js...');
fs.copyFileSync(
  path.join(__dirname, 'background.js'),
  path.join(distDir, 'background.js')
);

console.log('📜 Copying contentScript.js...');
fs.copyFileSync(
  path.join(__dirname, 'contentScript.js'),
  path.join(distDir, 'contentScript.js')
);

console.log('💉 Copying injected.js...');
fs.copyFileSync(
  path.join(__dirname, 'injected.js'),
  path.join(distDir, 'injected.js')
);

console.log('🧪 Copying tests directory...');
const testsDir = path.join(distDir, 'tests');
if (!fs.existsSync(testsDir)) {
  fs.mkdirSync(testsDir, { recursive: true });
}

fs.copyFileSync(
  path.join(__dirname, 'tests', 'threatTests.js'),
  path.join(testsDir, 'threatTests.js')
);

fs.copyFileSync(
  path.join(__dirname, 'tests', 'riskEngine.js'),
  path.join(testsDir, 'riskEngine.js')
);

// Copy popup files
console.log('📱 Copying popup files...');
fs.copyFileSync(
  path.join(__dirname, 'dist', 'index.html'),
  path.join(distDir, 'popup.html')
);

fs.copyFileSync(
  path.join(__dirname, 'dist', 'popup.js'),
  path.join(distDir, 'popup.js')
);

fs.copyFileSync(
  path.join(__dirname, 'dist', 'options.html'),
  path.join(distDir, 'options.html')
);

fs.copyFileSync(
  path.join(__dirname, 'dist', 'options.js'),
  path.join(distDir, 'options.js')
);

// Copy assets
const assetsDir = path.join(__dirname, 'dist', 'assets');
if (fs.existsSync(assetsDir)) {
  const distAssetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(distAssetsDir)) {
    fs.mkdirSync(distAssetsDir, { recursive: true });
  }
  
  const assets = fs.readdirSync(assetsDir);
  assets.forEach(asset => {
    fs.copyFileSync(
      path.join(assetsDir, asset),
      path.join(distAssetsDir, asset)
    );
  });
}

// Create simple icons (placeholder)
console.log('🎨 Creating placeholder icons...');
const iconsDir = path.join(distDir, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple SVG icon
const iconSvg = `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" rx="20" fill="#1976d2"/>
  <path d="M32 40h64v8H32v-8zm0 16h64v8H32v-8zm0 16h48v8H32v-8z" fill="white"/>
  <circle cx="96" cy="96" r="16" fill="#4caf50"/>
  <path d="M88 96l4 4 8-8" stroke="white" stroke-width="2" fill="none"/>
</svg>`;

// Convert SVG to different sizes (simplified - in production, use proper icon generation)
const sizes = [16, 32, 48, 128];
sizes.forEach(size => {
  const iconContent = iconSvg.replace('width="128"', `width="${size}"`).replace('height="128"', `height="${size}"`);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), iconContent);
});

console.log('✅ Extension build completed successfully!');
console.log(`📦 Extension files are in: ${distDir}`);
console.log('');
console.log('🚀 To load the extension in Chrome:');
console.log('1. Open Chrome and go to chrome://extensions/');
console.log('2. Enable "Developer mode"');
console.log('3. Click "Load unpacked" and select the dist folder');
console.log('');
console.log('🎯 Supported sites: ChatGPT, Claude, Bard');
console.log('📖 See docs/extension.md for detailed usage instructions');
