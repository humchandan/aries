import re

with open('src/app/(main)/dashboard/ecommerce/page.tsx', 'r') as f:
    content = f.read()

# Make Balance Card compact
content = content.replace('className="bg-muted/50 border rounded-xl p-5 mb-4 text-center"', 'className="bg-muted/50 border rounded-xl p-4 text-center"')
content = content.replace('className="text-3xl font-semibold tracking-tight font-mono"', 'className="text-2xl font-semibold tracking-tight font-mono"')

# 1. Extract Balance + Transfer
bal_trans_match = re.search(r'(<Card>\s*<CardHeader className="pb-2">\s*<div className="text-\[10px\] font-bold text-muted-foreground uppercase tracking-widest mb-2">Balance<\/div>.*?<\/Card>\n\s*\{\/\* Send Utility Credit - only if proxyAddress \*\/.*?<\/Card>\n\s*\)\}\n)', content, re.DOTALL)
bal_trans = bal_trans_match.group(1) if bal_trans_match else ""

# 2. Extract Wallet
wallet_match = re.search(r'(\{\/\* Utility Portal Account Wallet Card \*\/.*?<\/Card>\n)', content, re.DOTALL)
wallet = wallet_match.group(1) if wallet_match else ""

# 3. Remove Top Row Ledger Details entirely
top_row_match = re.search(r'(\s*\{\/\* Top Row - Ledger Details \*\/.*?<\/div>\n\s*<\/div>\n)', content, re.DOTALL)
if top_row_match:
    content = content.replace(top_row_match.group(1), "")

# 4. Insert bal_trans and wallet into Right Column above Transactions
right_col_match = re.search(r'(\{\/\* Right Column - Transactions \*\/.*?<div className="flex flex-col gap-6 lg:col-span-6 xl:col-span-6">\n)', content, re.DOTALL)
if right_col_match:
    replacement = right_col_match.group(1) + bal_trans + "\n" + wallet + "\n"
    content = content.replace(right_col_match.group(1), replacement)

with open('src/app/(main)/dashboard/ecommerce/page.tsx', 'w') as f:
    f.write(content)

