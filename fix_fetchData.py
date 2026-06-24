import re

with open('src/app/(main)/dashboard/finance/_components/proxy-wallet-manager.tsx', 'r') as f:
    content = f.read()

content = content.replace('fetchData();', '// fetchData();')

with open('src/app/(main)/dashboard/finance/_components/proxy-wallet-manager.tsx', 'w') as f:
    f.write(content)

