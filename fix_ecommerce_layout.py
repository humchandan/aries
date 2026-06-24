import re

with open('src/app/(main)/dashboard/ecommerce/page.tsx', 'r') as f:
    content = f.read()

# 1. Extract Balance card
balance_card_match = re.search(r'(          <Card>\n            <CardHeader className="pb-2">\n              <div className="text-\[10px\] font-bold text-muted-foreground uppercase tracking-widest mb-2">Balance</div>\n              <CardTitle>Available Credits</CardTitle>\n            </CardHeader>\n            <CardContent>\n              <div className="bg-muted/50 border rounded-xl p-4 text-center">\n                <div className="text-\[10px\] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Available Utility Balance</div>\n                <div className="text-2xl font-semibold tracking-tight font-mono">.*?</div>\n                <div className="text-\[12px\] text-muted-foreground mt-1">ARES</div>\n              </div>\n            </CardContent>\n          </Card>\n)', content, re.DOTALL)
balance_card = balance_card_match.group(1) if balance_card_match else ""

# 2. Modify Balance card to be more responsive
responsive_balance_card = balance_card.replace('text-2xl', 'text-xl md:text-2xl break-all line-clamp-1')

# 3. Remove original Balance card
content = content.replace(balance_card, "")

# 4. Insert Balance card at the very top of the layout (before the grid)
# Look for: <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
grid_start = '<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">'
content = content.replace(grid_start, responsive_balance_card + '\n      ' + grid_start)

with open('src/app/(main)/dashboard/ecommerce/page.tsx', 'w') as f:
    f.write(content)

