const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'frontend', 'pages');

const filesToUpdate = [
  'profile.js',
  'settings.js',
  'notifications.js',
  'winners.js',
  'privacy.js',
  'terms.js',
  'faq.js',
  'about.js',
  'contact.js',
  'admin/dashboard.js',
  'agent/dashboard.js',
  'vendor/dashboard.js',
  'organization/dashboard.js',
  'create-pool.js',
  'vendor/listings/create.js'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(pagesDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file} - does not exist.`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Only inject if not already there
  if (!content.includes('import BackButton')) {
    // Calculate relative path to components directory
    const depth = file.split('/').length - 1;
    const componentsPath = depth === 0 ? '../components/BackButton' : depth === 1 ? '../../components/BackButton' : '../../../components/BackButton';
    
    // Add import after the last import statement
    const importRegex = /^import.*?;?\s*$/gm;
    let match;
    let lastImportIndex = 0;
    while ((match = importRegex.exec(content)) !== null) {
      lastImportIndex = match.index + match[0].length;
    }
    
    // If no imports found, insert at beginning
    if (lastImportIndex === 0) {
      content = `import BackButton from '${componentsPath}';\n` + content;
    } else {
      content = content.slice(0, lastImportIndex) + `\nimport BackButton from '${componentsPath}';` + content.slice(lastImportIndex);
    }
    
    // Attempt to inject <BackButton />
    // We look for common container openings
    const containerRegex = /(<(?:div|main|section)[^>]*className="[^"]*(?:container|max-w-|px-)[^"]*"[^>]*>\s*)/;
    const matchContainer = content.match(containerRegex);
    if (matchContainer) {
      content = content.replace(containerRegex, `$1<div className="mb-4"><BackButton /></div>\n        `);
      console.log(`Successfully injected <BackButton /> into container of ${file}`);
    } else {
      // Look for any main opening
      const mainRegex = /(<main[^>]*>\s*)/;
      const matchMain = content.match(mainRegex);
      if (matchMain) {
        content = content.replace(mainRegex, `$1<div className="container mx-auto px-4 mt-4"><BackButton /></div>\n        `);
        console.log(`Successfully injected <BackButton /> into main of ${file}`);
      } else {
        // Just inject after the first return statement's opening tag
        const returnRegex = /(return\s*\(\s*(?:<>\s*)?<div[^>]*>\s*)/;
        const matchReturn = content.match(returnRegex);
        if (matchReturn) {
          content = content.replace(returnRegex, `$1<div className="container mx-auto px-4 mt-4"><BackButton /></div>\n        `);
          console.log(`Successfully injected <BackButton /> into return of ${file}`);
        } else {
          console.log(`Warning: Could not find suitable insertion point for ${file}`);
        }
      }
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
  } else {
    console.log(`Skipping ${file} - already has BackButton import.`);
  }
});

console.log('Done!');
