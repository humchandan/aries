import re

with open('src/app/(main)/dashboard/ecommerce/page.tsx', 'r') as f:
    content = f.read()

# Make the Balance Card compact
content = content.replace('className="bg-muted/50 border rounded-xl p-5 mb-4 text-center"', 'className="bg-muted/50 border rounded-xl p-4 text-center"')
content = content.replace('className="text-3xl font-semibold tracking-tight font-mono"', 'className="text-2xl font-semibold tracking-tight font-mono"')

# Rearrange HTML order.
# The user wants Service Catalog -> Make Payment -> ...
# Wait, let's just make the return structure explicitly:
# <div className="flex flex-col gap-6">
#   <Header />
#   <Service Catalog />
#   <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
#      <Left Column> Make Payment, Saved Billers </Left Column>
#      <Right Column> Balance, Wallet, Transfer, History </Right Column>
#   </div>
# </div>

# Let's extract all the cards.

catalog = re.search(r'(<Card className="h-full">\s*<CardHeader>\s*<CardTitle>Service Catalog<\/CardTitle>.*?<\/Card>)', content, re.DOTALL).group(1)
payment = re.search(r'(<Card className={selectedService \? "border-primary" : ""}>\s*<CardHeader className="pb-3">\s*<CardTitle className="text-lg flex items-center gap-2">\s*<CreditCard.*?<\/Card>)', content, re.DOTALL).group(1)
billers = re.search(r'(<Card>\s*<CardHeader className="pb-3">\s*<CardTitle className="text-lg flex items-center gap-2">\s*<Landmark.*?<\/Card>)', content, re.DOTALL).group(1)
balance = re.search(r'(<Card>\s*<CardHeader className="pb-2">\s*<div className="text-\[10px\] font-bold text-muted-foreground uppercase tracking-widest mb-2">Balance<\/div>.*?<\/Card>)', content, re.DOTALL).group(1)
wallet = re.search(r'({\/\* Utility Portal Account Wallet Card \*\/}\s*<Card className="border-primary\/20">.*?<\/Card>)', content, re.DOTALL).group(1)

transfer_match = re.search(r'({\/\* Send Utility Credit - only if proxyAddress \*\/}\s*{proxyAddress && \(\s*<Card>.*?<\/Card>\s*\)})', content, re.DOTALL)
transfer = transfer_match.group(1) if transfer_match else ""

history = re.search(r'(<Card className="h-full">\s*<CardHeader>\s*<div className="text-\[10px\] font-bold text-muted-foreground uppercase tracking-widest mb-2">History<\/div>.*?<\/Card>)', content, re.DOTALL).group(1)

dialog = re.search(r'({\/\* Edit Biller Dialog \*\/}\s*<Dialog.*?</Dialog>)', content, re.DOTALL).group(1)

# Construct new layout
new_return = f"""
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl leading-none tracking-tight">Utility Portal</h1>
        <p className="text-muted-foreground text-sm">Pay bills, top-up mobile, and manage your saved utility services.</p>
      </div>

      {{/* Service Catalog First */}}
      <div className="w-full">
{catalog}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {{/* Left Column */}}
        <div className="flex flex-col gap-6 lg:col-span-6 xl:col-span-6">
{payment}
{billers}
        </div>

        {{/* Right Column */}}
        <div className="flex flex-col gap-6 lg:col-span-6 xl:col-span-6">
{balance}
{wallet}
{transfer}
{history}
        </div>
      </div>

{dialog}
    </div>
  );
"""

content = re.sub(r'  return \(\s*<div className="flex flex-col gap-6">.*?</div>\s*\);\s*\}', new_return + '\n}', content, flags=re.DOTALL)

with open('src/app/(main)/dashboard/ecommerce/page.tsx', 'w') as f:
    f.write(content)

