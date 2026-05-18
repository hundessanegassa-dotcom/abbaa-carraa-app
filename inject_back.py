import os
import re

frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend', 'pages')

files_to_update = [
  'profile.js', 'settings.js', 'notifications.js', 'winners.js',
  'privacy.js', 'terms.js', 'faq.js', 'about.js', 'contact.js',
  'admin/dashboard.js', 'agent/dashboard.js', 'vendor/dashboard.js',
  'organization/dashboard.js', 'create-pool.js', 'vendor/listings/create.js'
]

for file in files_to_update:
    file_path = os.path.join(frontend_dir, file.replace('/', os.sep))
    if not os.path.exists(file_path):
        print(f"Skipping {file} - does not exist.")
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if 'import BackButton' not in content:
        depth = len(file.split('/')) - 1
        comp_path = '../components/BackButton' if depth == 0 else ('../../components/BackButton' if depth == 1 else '../../../components/BackButton')
        
        # Add import
        import_stmt = f"import BackButton from '{comp_path}';\n"
        
        last_import_pos = 0
        for match in re.finditer(r'^import.*?;?\s*$', content, re.MULTILINE):
            last_import_pos = match.end()
            
        if last_import_pos == 0:
            content = import_stmt + content
        else:
            content = content[:last_import_pos] + "\n" + import_stmt + content[last_import_pos:]
            
        # Inject tag
        container_pattern = r'(<(?:div|main|section)[^>]*className="[^"]*(?:container|max-w-|px-)[^"]*"[^>]*>\s*)'
        main_pattern = r'(<main[^>]*>\s*)'
        return_pattern = r'(return\s*\(\s*(?:<>\s*)?<div[^>]*>\s*)'
        
        if re.search(container_pattern, content):
            content = re.sub(container_pattern, r'\g<1><div className="mb-4"><BackButton /></div>\n        ', content, count=1)
            print(f"Injected container {file}")
        elif re.search(main_pattern, content):
            content = re.sub(main_pattern, r'\g<1><div className="container mx-auto px-4 mt-4"><BackButton /></div>\n        ', content, count=1)
            print(f"Injected main {file}")
        elif re.search(return_pattern, content):
            content = re.sub(return_pattern, r'\g<1><div className="container mx-auto px-4 mt-4"><BackButton /></div>\n        ', content, count=1)
            print(f"Injected return {file}")
        else:
            print(f"Could not find injection point for {file}")
            
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
    else:
        print(f"Already injected {file}")

print("Done!")
