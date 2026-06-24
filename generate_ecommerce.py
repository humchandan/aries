import re

with open('src/app/(main)/dashboard/ecommerce/page.tsx', 'r') as f:
    content = f.read()

imports_addition = """
import { ethers } from 'ethers';
import { waitForTransactionReceiptWithRetry } from "@/lib/txWaiter";
"""
content = content.replace('import { useWeb3 } from "@/hooks/useWeb3";', 'import { useWeb3 } from "@/hooks/useWeb3";\n' + imports_addition)

useweb3_addition = """
  const { userAddress, jwtToken, userProfile, provider, signer, loadProfile } = useWeb3();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [proxyAddress, setProxyAddress] = useState<string | null>(null);
  const [custodianBalance, setCustodianBalance] = useState(0);
  const [recipient, setRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const CUSTODY_WALLET_ADDRESS = "0xD01c1BFC96E22A9470C186E69E0A97e18EfF23e6";
"""
content = content.replace('const { jwtToken, userProfile } = useWeb3();', useweb3_addition)

fetch_data_update = """
      if (balRes.ok) {
        const balData = await balRes.json();
        setBalance(balData.balance || 0);
        setTransactions(balData.transactions || []);
      }
      if (userProfile && userProfile.proxyAddress) {
        setProxyAddress(userProfile.proxyAddress);
      }
"""
content = content.replace('setBalance(balData.balance || 0);', fetch_data_update)

proxy_functions = """
  const handleCreateProxy = async () => {
    if (!signer) return;
    try {
      setLoading(true);
      toast("Generating your private utility wallet...");
      
      const supportResponse = await fetch("/contracts/PortalFactory.json");
      const supportData = await supportResponse.json();
      const factoryContract = new ethers.Contract(supportData.address, supportData.abi, signer);
      
      const userId = ethers.keccak256(ethers.toUtf8Bytes("portal_user_" + userAddress.toLowerCase()));
      
      const tx = await factoryContract.createPortal(userId, {
        gasPrice: ethers.parseUnits("1.5", "gwei")
      });
      const receipt = await waitForTransactionReceiptWithRetry(signer.provider || provider, tx.hash);
      
      let proxyAddr = null;
      for (const log of receipt.logs) {
        try {
          const parsedLog = factoryContract.interface.parseLog(log);
          if (parsedLog && parsedLog.name === "PortalCreated") {
            proxyAddr = parsedLog.args.portalAddress;
            break;
          }
        } catch (e) {}
      }

      if (proxyAddr) {
        await fetch("/api/user/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${jwtToken}`
          },
          body: JSON.stringify({ proxyAddress: proxyAddr })
        });
        
        await loadProfile();
        setProxyAddress(proxyAddr);
        toast.success("Proxy wallet deployed and profile updated successfully!");
      } else {
        throw new Error("Could not retrieve proxy address from transaction logs.");
      }
    } catch (err: any) {
      console.error("Factory deploy failed:", err);
      toast.error(err.reason || err.message || "Factory deployment failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDepositProxy = async () => {
    if (!signer || !proxyAddress) return;
    const amountVal = parseFloat(depositAmount) || 0;
    if (amountVal <= 0) {
      toast.error("Enter a positive deposit amount!");
      return;
    }
    
    try {
      setLoading(true);
      toast(`Initiating direct deposit of ${amountVal} ARES to proxy...`);
      const tx = await signer.sendTransaction({
        to: proxyAddress,
        value: ethers.parseEther(amountVal.toString()),
        gasPrice: ethers.parseUnits("1.5", "gwei")
      });
      await waitForTransactionReceiptWithRetry(signer.provider || provider, tx.hash);
      toast.success(`Successfully deposited ${amountVal} ARES! The sweeper daemon will credit your ledger balance shortly.`);
      setDepositAmount('');
      fetchData();
    } catch (err: any) {
      console.error("Proxy deposit failed:", err);
      toast.error(err.message || "Deposit failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!recipient || !transferAmount) {
      toast.error("Recipient and amount are required!");
      return;
    }
    
    try {
      setLoading(true);
      const res = await fetch(`/api/ledger/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ recipient, amount: transferAmount })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Successfully sent utility credit! Net received: ${data.netAmount.toFixed(2)} ARES (5% fee deducted).`);
        setRecipient('');
        setTransferAmount('');
        fetchData();
      } else {
        toast.error(data.error || "Transfer failed.");
      }
    } catch (err) {
      console.error("Transfer failed:", err);
      toast.error("Transfer failed.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Address copied!");
  };

  const formattedProxy = proxyAddress 
    ? `${proxyAddress.substring(0, 6)}...${proxyAddress.substring(proxyAddress.length - 4)}`
    : '';
  const formattedCustody = `${CUSTODY_WALLET_ADDRESS.substring(0, 6)}...${CUSTODY_WALLET_ADDRESS.substring(CUSTODY_WALLET_ADDRESS.length - 4)}`;

  const transferAmountNum = parseFloat(transferAmount) || 0;
  const transferFee = transferAmountNum * 0.05;
  const netReceived = Math.max(0, transferAmountNum - transferFee);
"""
content = content.replace('  const handleSelectService = (service: any) => {', proxy_functions + '\n  const handleSelectService = (service: any) => {')


match_payment_form = re.search(r'(<Card className={selectedService \? "border-primary" : ""}>.*?</Card>)', content, re.DOTALL)
payment_form_card = match_payment_form.group(1) if match_payment_form else ""

match_saved_billers = re.search(r'(<Card>\s*<CardHeader className="pb-3">\s*<CardTitle className="text-lg flex items-center gap-2">\s*<Landmark.*?Saved Billers.*?</Card>)', content, re.DOTALL)
saved_billers_card = match_saved_billers.group(1) if match_saved_billers else ""

match_service_catalog = re.search(r'(<Card className="h-full">\s*<CardHeader>\s*<CardTitle>Service Catalog</CardTitle>.*?</Card>)', content, re.DOTALL)
service_catalog_card = match_service_catalog.group(1) if match_service_catalog else ""

match_dialog = re.search(r'({\/\* Edit Biller Dialog \*\/}.*?</Dialog>)', content, re.DOTALL)
edit_biller_dialog = match_dialog.group(1) if match_dialog else ""

wallet_card = """
          {/* Utility Portal Account Wallet Card */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Your Wallet</div>
              <CardTitle>Utility Portal Account Wallet</CardTitle>
              <CardDescription>Your unique EIP-1167 proxy wallet. Funds sent here are automatically routed to the admin custody address and credited to your utility portal balance.</CardDescription>
            </CardHeader>
            <CardContent>
              {!proxyAddress ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <CreditCard className="text-muted-foreground" />
                  </div>
                  <h4 className="font-semibold mb-1">No Utility Wallet Found</h4>
                  <p className="text-xs text-muted-foreground mb-4">Register on the utility portal to generate your unique blockchain deposit address.</p>
                  <Button onClick={handleCreateProxy} disabled={loading} variant="secondary">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Utility Address
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Your Unique Deposit Address</Label>
                    <div className="flex gap-2">
                      <Input value={proxyAddress} readOnly className="font-mono text-xs" />
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(proxyAddress)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Send Direct Deposit</Label>
                    <div className="flex gap-2">
                      <Input type="number" placeholder="Amount (ARES)" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
                      <Button onClick={handleDepositProxy} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Deposit
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 border mt-2 text-center text-xs text-muted-foreground">
                    Auto-routing: {formattedProxy} &rarr; {formattedCustody}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
"""

transfer_card = """
          {/* Send Utility Credit - only if proxyAddress */}
          {proxyAddress && (
            <Card>
              <CardHeader>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Transfer</div>
                <CardTitle>Send Utility Credit</CardTitle>
                <CardDescription>Send ARES from your proxy balance directly to another user's wallet. A 5% network transfer fee applies.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Recipient Address</Label>
                  <Input placeholder="0x..." value={recipient} onChange={(e) => setRecipient(e.target.value)} className="font-mono text-xs" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Amount (ARES)</Label>
                  <Input type="number" placeholder="0.0" min="0" step="1" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} />
                </div>
                {transferAmountNum > 0 && (
                  <div className="bg-muted rounded-lg p-3 space-y-1 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Transfer Amount:</span>
                      <span>{transferAmountNum.toFixed(2)} ARES</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Network Fee (5%):</span>
                      <span className="text-red-400">-{transferFee.toFixed(2)} ARES</span>
                    </div>
                    <div className="h-px bg-border my-1" />
                    <div className="flex justify-between font-bold">
                      <span>Recipient Gets:</span>
                      <span className="text-emerald-500">{netReceived.toFixed(2)} ARES</span>
                    </div>
                  </div>
                )}
                <Button className="w-full" onClick={handleTransfer} disabled={loading || transferAmountNum <= 0 || !recipient}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Send Funds
                </Button>
              </CardContent>
            </Card>
          )}
"""

balance_card = """
          <Card>
            <CardHeader className="pb-2">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Balance</div>
              <CardTitle>Available Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 border rounded-xl p-4 text-center">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Available Utility Balance</div>
                <div className="text-xl font-semibold tracking-tight font-mono">{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="text-[12px] text-muted-foreground mt-1">ARES</div>
              </div>
            </CardContent>
          </Card>
"""

transactions_card = """
          <Card className="h-full">
            <CardHeader>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">History</div>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {transactions.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-sm border border-dashed rounded-xl">No transactions yet.</div>
                ) : (
                  transactions.map((tx: any) => {
                    const isReceived = tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_IN' || tx.type === 'CLAIM_DIRECT';
                    return (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border hover:bg-muted/60 transition-colors">
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="text-xs font-bold mb-1">{tx.type}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{tx.description}</div>
                          <div className="text-[9px] text-muted-foreground/60 mt-0.5">{new Date(tx.timestamp).toLocaleString()}</div>
                        </div>
                        <span className={`text-xs font-semibold font-mono flex-shrink-0 px-2.5 py-1 rounded-md bg-background border ${isReceived ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isReceived ? '+' : '-'}{isReceived ? tx.netAmount?.toFixed(2) : tx.amount?.toFixed(2)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
"""

new_return_statement = f"""
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl leading-none tracking-tight">Utility Portal</h1>
        <p className="text-muted-foreground text-sm">Pay bills, top-up mobile, and manage your saved utility services.</p>
      </div>

      {{/* Top Row - Ledger Details */}}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
{balance_card}
{transfer_card}
        </div>
        <div className="flex flex-col gap-6">
{wallet_card}
        </div>
      </div>

      {{/* Middle Section - Catalog */}}
      <div className="w-full">
        {service_catalog_card}
      </div>

      {{/* Bottom Section - Payment */}}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column - Form & Billers */}
        <div className="flex flex-col gap-6 lg:col-span-6 xl:col-span-6">
{payment_form_card}
{saved_billers_card}
        </div>

        {/* Right Column - Transactions */}
        <div className="flex flex-col gap-6 lg:col-span-6 xl:col-span-6">
{transactions_card}
        </div>
      </div>

{edit_biller_dialog}
    </div>
  );
"""

content = re.sub(r'  return \(\s*<div className="flex flex-col gap-6">.*?</div>\s*\);\s*\}', new_return_statement + '\n}', content, flags=re.DOTALL)

# Fix double curly brace react comments that python f-string escapes
content = content.replace('{{/*', '{/*')
content = content.replace('*/}}', '*/}')

with open('src/app/(main)/dashboard/ecommerce/page.tsx', 'w') as f:
    f.write(content)

