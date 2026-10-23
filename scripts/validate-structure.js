/**
 * DecodeLabs DevOps Project 3: Structure Validator
 * Verifies that all mandatory files and configurations exist before running tests.
 */
const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  'index.html',
  'style.css',
  'script.js',
  'package.json',
  'README.md',
  'LICENSE',
  '.gitignore',
  'tests/app.test.js',
  '.github/workflows/ci-cd.yml'
];

console.log('🔍 [Stage 2: Build & Validation] Checking project structure...\n');

let missingFiles = 0;

REQUIRED_FILES.forEach(file => {
  const fullPath = path.resolve(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    if (stats.size > 0) {
      console.log(`  ✅ Found: ${file} (${stats.size} bytes)`);
    } else {
      console.error(`  ❌ Empty file: ${file}`);
      missingFiles++;
    }
  } else {
    console.error(`  ❌ Missing required file: ${file}`);
    missingFiles++;
  }
});

console.log('\n----------------------------------------');
if (missingFiles > 0) {
  console.error(`🚨 Validation FAILED: ${missingFiles} required file(s) missing or empty.`);
  process.exit(1);
} else {
  console.log(`✨ Validation PASSED: All ${REQUIRED_FILES.length} project files verified.`);
  process.exit(0);
}
