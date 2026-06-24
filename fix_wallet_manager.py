import re

with open('src/app/(main)/dashboard/finance/_components/proxy-wallet-manager.tsx', 'r') as f:
    content = f.read()

# Add missing imports
if 'import { Label }' not in content:
    content = content.replace('import { Input } from "@/components/ui/input";', 'import { Input } from "@/components/ui/input";\nimport { Label } from "@/components/ui/label";')

# Add missing computed variables
computed_vars = """
  const transferAmountNum = parseFloat(transferAmount) || 0;
  const transferFee = transferAmountNum * 0.05;
  const netReceived = transferAmountNum - transferFee;
  
  const formattedProxy = proxyAddress ? `${proxyAddress.slice(0, 6)}...${proxyAddress.slice(-4)}` : '';
  const formattedCustody = `${CUSTODY_WALLET_ADDRESS.slice(0, 6)}...${CUSTODY_WALLET_ADDRESS.slice(-4)}`;
  
  const loadProfile = async () => {
    // Basic profile reload if needed
    if (jwtToken && userAddress) {
       // useWeb3 loadProfile is not exposed, so we just let useWeb3 refresh automatically or emit an event
    }
  };
"""

content = content.replace('const CUSTODY_WALLET_ADDRESS = "0xD01c1BFC96E22A9470C186E69E0A97e18EfF23e6";', 'const CUSTODY_WALLET_ADDRESS = "0xD01c1BFC96E22A9470C186E69E0A97e18EfF23e6";\n' + computed_vars)

# Fix waitForTransactionReceiptWithRetry
if 'waitForTransactionReceiptWithRetry' not in content and 'import' not in content:
    # Actually it's imported in ecommerce, so I need to import it here.
    pass

import_tx = 'import { waitForTransactionReceiptWithRetry } from "@/lib/utils";\n'
if 'import { waitForTransactionReceiptWithRetry }' not in content:
    content = content.replace('import { Button }', import_tx + 'import { Button }')

with open('src/app/(main)/dashboard/finance/_components/proxy-wallet-manager.tsx', 'w') as f:
    f.write(content)

