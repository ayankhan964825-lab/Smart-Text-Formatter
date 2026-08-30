import os

for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root:
        continue
    for file in files:
        if file.endswith(('.html', '.js', '.md', '.css', '.json')):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content.replace('FormatFlow', 'FormatxFlow')
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f'Updated {path}')
            except Exception as e:
                pass
