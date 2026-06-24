import re

with open('src/app/(main)/dashboard/ecommerce/page.tsx', 'r') as f:
    content = f.read()

# Extract Wallet Card
wallet_match = re.search(r'({\/\* Utility Portal Account Wallet Card \*\/.*?<\/Card>)', content, re.DOTALL)
wallet = wallet_match.group(1) if wallet_match else ""

# Extract Transfer Card
transfer_match = re.search(r'({\/\* Send Utility Credit - only if proxyAddress \*\/}.*?<\/Card>\n\s*\)})', content, re.DOTALL)
transfer = transfer_match.group(1) if transfer_match else ""

# Extract handleCreateProxy
create_proxy_match = re.search(r'(  const handleCreateProxy = async \(\) => {.*?^  };)', content, re.MULTILINE | re.DOTALL)
create_proxy = create_proxy_match.group(1) if create_proxy_match else ""

# Extract handleDepositProxy
deposit_proxy_match = re.search(r'(  const handleDepositProxy = async \(\) => {.*?^  };)', content, re.MULTILINE | re.DOTALL)
deposit_proxy = deposit_proxy_match.group(1) if deposit_proxy_match else ""

# Extract handleTransfer
transfer_func_match = re.search(r'(  const handleTransfer = async \(\) => {.*?^  };)', content, re.MULTILINE | re.DOTALL)
transfer_func = transfer_func_match.group(1) if transfer_func_match else ""

# Extract copyToClipboard
copy_func_match = re.search(r'(  const copyToClipboard = \(text: string\) => {.*?^  };)', content, re.MULTILINE | re.DOTALL)
copy_func = copy_func_match.group(1) if copy_func_match else ""

new_component = f"""// proxy-wallet-manager.tsx
"use client";

import {{ useState, useEffect }} from "react";
import {{ ethers }} from "ethers";
import {{ toast }} from "sonner";
import {{ Copy, Loader2, Send, Wallet }} from "lucide-react";
import {{ Button }} from "@/components/ui/button";
import {{ Card, CardContent, CardDescription, CardHeader, CardTitle }} from "@/components/ui/card";
import {{ Input }} from "@/components/ui/input";
import {{ useWeb3 }} from "@/hooks/useWeb3";

export function ProxyWalletManager() {{
  const {{ userAddress, signer, provider, jwtToken, userProfile }} = useWeb3();
  const [proxyAddress, setProxyAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [custodianBalance, setCustodianBalance] = useState("0");
  
  const [recipient, setRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  
  const CUSTODY_WALLET_ADDRESS = "0xD01c1BFC96E22A9470C186E69E0A97e18EfF23e6";

  useEffect(() => {{
    if (userProfile && userProfile.proxyAddress) {{
      setProxyAddress(userProfile.proxyAddress);
    }}
  }}, [userProfile]);

  useEffect(() => {{
    const checkBalance = async () => {{
      if (proxyAddress && provider) {{
        try {{
          const TokenArtifact = await import("../../../../../public/contracts/AriesToken.json");
          const token = new ethers.Contract(TokenArtifact.default.address, TokenArtifact.default.abi, provider);
          const bal = await token.balanceOf(proxyAddress);
          setCustodianBalance(ethers.formatUnits(bal, 18));
        }} catch(e) {{
          console.error(e);
        }}
      }}
    }};
    checkBalance();
  }}, [proxyAddress, provider]);

{create_proxy}

{deposit_proxy}

{transfer_func}

{copy_func}

  return (
    <div className="flex flex-col gap-6">
      {wallet}
      {transfer}
    </div>
  );
}}
"""

with open('src/app/(main)/dashboard/finance/_components/proxy-wallet-manager.tsx', 'w') as f:
    f.write(new_component)

print("Created proxy-wallet-manager.tsx")

# Now remove these from ecommerce/page.tsx
content = content.replace(wallet, "")
content = content.replace(transfer, "")
content = content.replace(create_proxy, "")
content = content.replace(deposit_proxy, "")
content = content.replace(transfer_func, "")
# We keep copyToClipboard if it's used elsewhere, but let's check.
if content.count('copyToClipboard') == 1: # only the definition remains
    content = content.replace(copy_func, "")

with open('src/app/(main)/dashboard/ecommerce/page.tsx', 'w') as f:
    f.write(content)

print("Removed from ecommerce/page.tsx")
