import re

with open('src/app/(main)/dashboard/finance/_components/proxy-wallet-manager.tsx', 'r') as f:
    content = f.read()

# Replace the checkBalance implementation
old_check = """        try {
          const TokenArtifact = await import("../../../../../../public/contracts/AriesToken.json");
          const token = new ethers.Contract(TokenArtifact.default.address, TokenArtifact.default.abi, provider);
          const bal = await token.balanceOf(proxyAddress);
          setCustodianBalance(ethers.formatUnits(bal, 18));
        } catch(e) {
          console.error(e);
        }"""

new_check = """        try {
          const bal = await provider.getBalance(proxyAddress);
          setCustodianBalance(ethers.formatEther(bal));
        } catch(e) {
          console.error(e);
        }"""

content = content.replace(old_check, new_check)

with open('src/app/(main)/dashboard/finance/_components/proxy-wallet-manager.tsx', 'w') as f:
    f.write(content)

