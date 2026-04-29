import re
f = r'c:\Users\ayyub\.gemini\antigravity\scratch\NewProject\cauchy_ppt\index.html'
html = open(f, 'r', encoding='utf-8').read()

sections = list(re.finditer(r'<section[^>]*id="slide-\d+"', html))
print(f'Found {len(sections)} sections')

result = html
offset = 0
for i, m in enumerate(sections):
    old = m.group()
    new = re.sub(r'id="slide-\d+"', f'id="slide-{i+1}"', old)
    start = m.start() + offset
    end = m.end() + offset
    result = result[:start] + new + result[end:]
    offset += len(new) - len(old)

open(f, 'w', encoding='utf-8').write(result)
ids = re.findall(r'id="slide-(\d+)"', result)
print(f'Fixed! New IDs: {ids}')
