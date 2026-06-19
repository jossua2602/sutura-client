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
            
            # Make sure `user` is destructured
            match = re.search(r'const \{.*?\} = useAuthStore\(\);', content, re.DOTALL)
            if match and 'user' not in match.group():
                content = re.sub(r'(const \{)(.*?)(\}\s*=\s*useAuthStore\(\);)', r'\1\2, user \3', content)

            # Fix the useEffect logic
            content = re.sub(r'(\s*)\}\n(\s*)\}, \[shop\]\);', r'\1} else if (user && !shop) {\1  setLoading(false);\1}\n\2}, [shop, user]);', content)

            if content != original_content:
                with open(filepath, 'w') as f:
                    f.write(content)
                print(f'Fixed {filepath}')

