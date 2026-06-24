import re

with open('src/app/(main)/dashboard/ecommerce/page.tsx', 'r') as f:
    content = f.read()

# 1. Remove the entire duplicate block at the bottom Right Column
duplicate_block_match = re.search(r'(\{\/\* Utility Portal Account Wallet Card \*\/.*?<\/Card>\s*\{\/\* Send Utility Credit - only if proxyAddress \*\/.*?<\/Card>\n)', content, re.DOTALL)
if duplicate_block_match:
    # Let's find the second instance to be safe
    parts = content.split('Utility Portal Account Wallet Card')
    if len(parts) > 2:
        # There are duplicates
        pass

# Actually, let's do this deterministically by lines
lines = content.split('\n')

# Find first Transfer Card
start_transfer1 = -1
end_transfer1 = -1
for i, line in enumerate(lines):
    if "{/* Send Utility Credit - only if proxyAddress */}" in line:
        if start_transfer1 == -1:
            start_transfer1 = i
        else:
            pass

if start_transfer1 != -1:
    for i in range(start_transfer1, len(lines)):
        if "Send Funds" in lines[i]:
            # find the next </Card>
            for j in range(i, len(lines)):
                if "</Card>" in lines[j]:
                    end_transfer1 = j
                    break
            break

transfer_card_lines = lines[start_transfer1:end_transfer1+1]
transfer_card_str = '\n'.join(transfer_card_lines) + '\n'

# Delete first Transfer Card from left column
lines = lines[:start_transfer1] + lines[end_transfer1+1:]

# Now find duplicate wallet and transfer at the bottom
start_dup = -1
end_dup = -1
for i in range(len(lines)-1, -1, -1):
    if "{/* Utility Portal Account Wallet Card */}" in lines[i]:
        start_dup = i
        break

if start_dup != -1:
    for i in range(start_dup, len(lines)):
        if "Send Funds" in lines[i]:
            for j in range(i, len(lines)):
                if "</Card>" in lines[j]:
                    end_dup = j
                    break
            break

# Delete the duplicates from the bottom
if start_dup != -1 and end_dup != -1:
    lines = lines[:start_dup] + lines[end_dup+1:]

# Reconstruct content
content = '\n'.join(lines)

# Now, we want to put Transfer Card below Balance Card
# The top row looks like:
#      {/* Top Row - Balance & Wallet */}
#      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
#        <div>
#          <Card> ... Balance ... </Card>
#        </div>

# We will inject transfer_card_str right after the Balance Card's closing </Card>
balance_end_search = r'(<CardTitle>Available Credits<\/CardTitle>.*?<\/Card>\n)'
match = re.search(balance_end_search, content, re.DOTALL)
if match:
    replacement = match.group(1) + "          <div className=\"mt-6\">\n" + "  " + transfer_card_str.replace('\n', '\n  ') + "\n          </div>\n"
    content = content.replace(match.group(1), replacement)

with open('src/app/(main)/dashboard/ecommerce/page.tsx', 'w') as f:
    f.write(content)
