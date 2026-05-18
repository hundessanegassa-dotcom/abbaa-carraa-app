const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');

const filesToUpdate = [
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
  
  if (!content.includes('import BackButton')) {
    const depth = file.split('/').length - 1;
    const componentsPath = depth === 0 ? '../components/BackButton' : depth === 1 ? '../../components/BackButton' : '../../../components/BackButton';
    
    // add import at top
    content = `import BackButton from '${componentsPath}';\n` + content;
    
    // inject tag right after <DashboardLayout> or <Navbar> or <div className="container...
    if (content.includes('<DashboardLayout')) {
       content = content.replace(/(<DashboardLayout[^>]*>)/, `$1\n      <div className="container mx-auto px-4 mt-4"><BackButton /></div>`);
       console.log(`Injected into DashboardLayout of ${file}`);
    } else if (content.includes('<Navbar />')) {
       content = content.replace(/(<Navbar \/>)/, `$1\n      <div className="container mx-auto px-4 mt-4"><BackButton /></div>`);
       console.log(`Injected into Navbar of ${file}`);
    } else {
       const containerRegex = /(<(?:div|main|section)[^>]*className="[^"]*(?:container|max-w-|px-)[^"]*"[^>]*>\s*)/;
       if (containerRegex.test(content)) {
         content = content.replace(containerRegex, `$1<div className="mb-4"><BackButton /></div>\n        `);
         console.log(`Injected into container of ${file}`);
       }
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

console.log('Done script');
