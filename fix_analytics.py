import re

with open('src/app/(main)/dashboard/(legacy)/analytics-v1/_components/analytics-actions-manager-queue.tsx', 'r') as f:
    content = f.read()

content = content.replace('{ noDecimals: true }', '')

with open('src/app/(main)/dashboard/(legacy)/analytics-v1/_components/analytics-actions-manager-queue.tsx', 'w') as f:
    f.write(content)

