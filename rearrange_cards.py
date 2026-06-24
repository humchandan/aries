import re

with open('src/app/(main)/dashboard/ecommerce/page.tsx', 'r') as f:
    content = f.read()

# 1. Extract Balance Card
balance_match = re.search(r'(<Card>\s*<CardHeader className="pb-2">\s*<div className="text-\[10px\] font-bold text-muted-foreground uppercase tracking-widest mb-2">Balance<\/div>\s*<CardTitle>Available Credits<\/CardTitle>\s*<\/CardHeader>.*?<\/Card>\n)', content, re.DOTALL)
balance_card = balance_match.group(1) if balance_match else ""

# 2. Extract Wallet Card
wallet_match = re.search(r'(\s*\{\/\* Utility Portal Account Wallet Card \*\/.*?<\/Card>\n)', content, re.DOTALL)
wallet_card = wallet_match.group(1) if wallet_match else ""

# Remove them from current locations
if balance_card:
    content = content.replace(balance_card, "")
if wallet_card:
    content = content.replace(wallet_card, "")

# Find Service Catalog injection point
catalog_start = r'(\{\/\* Top Section - Catalog \*\/.*?<div className="w-full">)'
match_catalog = re.search(catalog_start, content, re.DOTALL)

if match_catalog:
    new_top_row = f"""
      {{/* Top Row - Balance & Wallet */}}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
{balance_card}
        </div>
        <div>
{wallet_card}
        </div>
      </div>

"""
    content = content.replace(match_catalog.group(1), new_top_row + match_catalog.group(1))

with open('src/app/(main)/dashboard/ecommerce/page.tsx', 'w') as f:
    f.write(content)

