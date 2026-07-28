// scripts/detect-errors.js
// Run: node scripts/detect-errors.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const errors = {
  supabase: [],
  nextjs: [],
  telegram: [],
  vercel: []
};

// Scan for Supabase issues
function scanSupabase() {
  console.log('🔍 Scanning Supabase issues...');
  
  // Check for missing columns
  const files = getAllFiles('./pages', ['.js', '.jsx', '.ts', '.tsx']);
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    // Look for .from('table') without proper error handling
    if (content.includes('.from(') && !content.includes('.maybeSingle()') && content.includes('.single()')) {
      errors.supabase.push({
        file,
        message: 'Use .maybeSingle() instead of .single() to avoid 406 errors'
      });
    }
    // Look for missing RLS policies
    if (content.includes('.insert(') && !content.includes('auth.uid()')) {
      errors.supabase.push({
        file,
        message: 'Missing RLS policy check for insert'
      });
    }
  });
}

// Scan for Next.js issues
function scanNextJS() {
  console.log('🔍 Scanning Next.js issues...');
  
  // Check for missing imports
  const files = getAllFiles('./pages', ['.js', '.jsx', '.ts', '.tsx']);
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    // Check for missing use client
    if (file.includes('/app/') && !content.includes('use client') && content.includes('useState')) {
      errors.nextjs.push({
        file,
        message: 'Add "use client" directive for client components in App Router'
      });
    }
  });
}

// Scan for Telegram issues
function scanTelegram() {
  console.log('🔍 Scanning Telegram bot issues...');
  
  const botFile = './lib/bot.js';
  if (fs.existsSync(botFile)) {
    const content = fs.readFileSync(botFile, 'utf8');
    if (content.includes('.on(') && !content.includes('.subscribe(')) {
      errors.telegram.push({
        file: botFile,
        message: 'Ensure .on() is called before .subscribe() for realtime subscriptions'
      });
    }
  }
}

// Helper: Get all files recursively
function getAllFiles(dir, extensions) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, extensions));
    } else if (extensions.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  });
  return results;
}

// Generate report
function generateReport() {
  console.log('\n📋 ERROR DETECTION REPORT\n');
  console.log('='.repeat(50));
  
  let totalErrors = 0;
  Object.keys(errors).forEach(category => {
    if (errors[category].length > 0) {
      console.log(`\n🔴 ${category.toUpperCase()} ERRORS (${errors[category].length}):`);
      errors[category].forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.file}`);
        console.log(`     → ${err.message}`);
        totalErrors++;
      });
    }
  });

  if (totalErrors === 0) {
    console.log('\n✅ No errors detected!');
  } else {
    console.log(`\n📊 Total errors found: ${totalErrors}`);
  }
}

// Run scans
scanSupabase();
scanNextJS();
scanTelegram();
generateReport();
