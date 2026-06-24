import re

with open('src/app/(main)/dashboard/finance/page.tsx', 'r') as f:
    content = f.read()

# Import the ProxyWalletManager
import_statement = 'import { ProxyWalletManager } from "./_components/proxy-wallet-manager";\n'
content = content.replace('import { MappedWithdrawals } from "./_components/mapped-withdrawals";\n', 'import { MappedWithdrawals } from "./_components/mapped-withdrawals";\n' + import_statement)

# Replace the layout
old_layout = """        <TabsContent value="30-days" className="flex flex-col gap-4">
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
            <div className="xl:col-span-6">
              <OverviewKpis />
            </div>

            <div className="flex flex-col gap-4 xl:col-span-6">
              <MappedInvestments />
              <MappedHistory />
            </div>
          </div>"""

new_layout = """        <TabsContent value="30-days" className="flex flex-col gap-4">
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
            <div className="flex flex-col gap-4 xl:col-span-6">
              <OverviewKpis />
              <MappedInvestments />
              <MappedHistory />
            </div>

            <div className="flex flex-col gap-4 xl:col-span-6">
              <ProxyWalletManager />
            </div>
          </div>"""

content = content.replace(old_layout, new_layout)

with open('src/app/(main)/dashboard/finance/page.tsx', 'w') as f:
    f.write(content)

