import re

with open('src/app/(main)/dashboard/ecommerce/page.tsx', 'r') as f:
    content = f.read()

# 1. Extract the Wallet Card
wallet_match = re.search(r'(\{\{\/\* Utility Portal Account Wallet Card \*\/.*?<\/Card>\n\n)', content, re.DOTALL)
if not wallet_match:
    # Try with normal braces
    wallet_match = re.search(r'(\s*\{\/\* Utility Portal Account Wallet Card \*\/.*?<\/Card>\n)', content, re.DOTALL)
    
wallet_card = wallet_match.group(1) if wallet_match else ""

# 2. Extract the Transfer Card
transfer_match = re.search(r'(\s*\{\/\* Send Utility Credit - only if proxyAddress \*\/.*?<\/Card>\n\s*\)\})', content, re.DOTALL)
transfer_card = transfer_match.group(1) if transfer_match else ""

# 3. Remove them from Left Column
if wallet_card:
    content = content.replace(wallet_card, "")
if transfer_card:
    content = content.replace(transfer_card, "")

# 4. Modify the Balance card font size and margins
# Find: <div className="text-3xl font-semibold tracking-tight font-mono">
content = content.replace('className="text-3xl font-semibold tracking-tight font-mono"', 'className="text-xl font-semibold tracking-tight font-mono"')
# Find: <div className="bg-muted/50 border rounded-xl p-5 mb-4 text-center">
content = content.replace('className="bg-muted/50 border rounded-xl p-5 mb-4 text-center"', 'className="bg-muted/50 border rounded-xl p-4 text-center"')

# 5. Insert Wallet and Transfer into the Right Column, just below the Balance Card
balance_card_end = r'(\{\/\* Right Column - Balance & Transactions \*\/.*?<\/Card>\n)'
match_balance_end = re.search(balance_card_end, content, re.DOTALL)

if match_balance_end:
    replacement = match_balance_end.group(1) + wallet_card + "\n" + transfer_card + "\n"
    content = content.replace(match_balance_end.group(1), replacement)

with open('src/app/(main)/dashboard/ecommerce/page.tsx', 'w') as f:
    f.write(content)
