import os
import re

dashboard_dir = 'src/app'

for root, _, files in os.walk(dashboard_dir):
    for file in files:
        if file.endswith('.tsx') and ('dashboard' in root or 'staff-dashboard' in root):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            original_content = content
            
            # Replace synchronous setLoading(false); with setTimeout inside the else if (user && !shop) block
            # For the ones processed by python:
            content = re.sub(
                r'(\} else if \(user && !shop\) \{\s*)setLoading\(false\);(\s*\})',
                r'\1setTimeout(() => setLoading(false), 0);\2',
                content
            )

            # For the ones done manually like fetchServices, fetchBranches, fetchStaff, etc.
            content = re.sub(
                r'(if \(user\) )setLoading\(false\);',
                r'\1setTimeout(() => setLoading(false), 0);',
                content
            )

            # Tailwind arbitrary value replacements
            replacements = {
                r'bg-\[var\(--brand-taupe\)\]': 'bg-taupe',
                r'hover:bg-\[var\(--brand-taupe\)\]/90': 'hover:bg-taupe/90',
                r'text-\[var\(--brand-taupe\)\]': 'text-taupe',
                r'hover:text-\[var\(--brand-taupe-hover\)\]': 'hover:text-taupe-hover',
                r'focus:border-\[var\(--brand-taupe\)\]': 'focus:border-taupe',
                r'focus:ring-\[var\(--brand-taupe\)\]': 'focus:ring-taupe',
                r'hover:text-\[var\(--brand-taupe\)\]': 'hover:text-taupe',
                r'bg-gradient-to-r': 'bg-linear-to-r',
                r'bg-gradient-to-b': 'bg-linear-to-b',
                r'aspect-\[3/4\]': 'aspect-3/4',
                r'flex-shrink-0': 'shrink-0'
            }

            for pattern, repl in replacements.items():
                content = re.sub(pattern, repl, content)

            if content != original_content:
                with open(filepath, 'w') as f:
                    f.write(content)
                print(f'Fixed linting in {filepath}')
