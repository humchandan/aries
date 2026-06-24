// proxy-wallet-manager.tsx
"use client";

import { useEffect, useState } from "react";

import { ethers } from "ethers";
import { Copy, CreditCard, Edit, Loader2, Send, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWeb3 } from "@/hooks/useWeb3";
import { waitForTransactionReceiptWithRetry } from "@/lib/txWaiter";

export function ProxyWalletManager() {
  const { userAddress, signer, provider, jwtToken, userProfile } = useWeb3();
  const [proxyAddress, setProxyAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [custodianBalance, setCustodianBalance] = useState("0");

  const [recipient, setRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  const CUSTODY_WALLET_ADDRESS = "0xD01c1BFC96E22A9470C186E69E0A97e18EfF23e6";

  const transferAmountNum = parseFloat(transferAmount) || 0;
  const transferFee = transferAmountNum * 0.05;
  const netReceived = transferAmountNum - transferFee;

  const formattedProxy = proxyAddress ? `${proxyAddress.slice(0, 6)}...${proxyAddress.slice(-4)}` : "";
  const formattedCustody = `${CUSTODY_WALLET_ADDRESS.slice(0, 6)}...${CUSTODY_WALLET_ADDRESS.slice(-4)}`;

  const loadProfile = async () => {
    // Basic profile reload if needed
    if (jwtToken && userAddress) {
      // useWeb3 loadProfile is not exposed, so we just let useWeb3 refresh automatically or emit an event
    }
  };

  useEffect(() => {
    if (userProfile && userProfile.proxyAddress) {
      setProxyAddress(userProfile.proxyAddress);
    }
  }, [userProfile]);

  useEffect(() => {
    const checkBalance = async () => {
      if (proxyAddress && provider) {
        try {
          const bal = await provider.getBalance(proxyAddress);
          setCustodianBalance(ethers.formatEther(bal));
        } catch (e) {
          console.error(e);
        }
      }
    };
    checkBalance();
  }, [proxyAddress, provider]);

  const handleCreateProxy = async () => {
    if (!signer || !userAddress) return;
    try {
      setLoading(true);
      toast("Generating your private utility wallet...");

      const supportResponse = await fetch("/contracts/PortalFactory.json");
      const supportData = await supportResponse.json();
      const factoryContract = new ethers.Contract(supportData.address, supportData.abi, signer);

      const userId = ethers.keccak256(ethers.toUtf8Bytes("portal_user_" + userAddress.toLowerCase()));

      const tx = await factoryContract.createPortal(userId, {
        gasPrice: ethers.parseUnits("1.5", "gwei"),
      });
      const txProvider = signer.provider || provider;
      if (!txProvider) throw new Error("No provider available");
      const receipt = await waitForTransactionReceiptWithRetry(txProvider as any, tx.hash);

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
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({ proxyAddress: proxyAddr }),
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
        gasPrice: ethers.parseUnits("1.5", "gwei"),
      });
      const txProvider = signer.provider || provider;
      if (!txProvider) throw new Error("No provider available");
      await waitForTransactionReceiptWithRetry(txProvider, tx.hash);
      toast.success(
        `Successfully deposited ${amountVal} ARES! The sweeper daemon will credit your ledger balance shortly.`,
      );
      setDepositAmount("");
      // fetchData();
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ recipient, amount: transferAmount }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(
          `Successfully sent utility credit! Net received: ${data.netAmount.toFixed(2)} ARES (5% fee deducted).`,
        );
        setRecipient("");
        setTransferAmount("");
        // fetchData();
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

  return (
    <div className="flex flex-col gap-6">
      {/* Utility Portal Account Wallet Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Your Wallet</div>
          <CardTitle>Utility Portal Account Wallet</CardTitle>
          <CardDescription>
            Your unique EIP-1167 proxy wallet. Funds sent here are automatically routed to the admin custody address and
            credited to your utility portal balance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!proxyAddress ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <CreditCard className="text-muted-foreground" />
              </div>
              <h4 className="font-semibold mb-1">No Utility Wallet Found</h4>
              <p className="text-xs text-muted-foreground mb-4">
                Register on the utility portal to generate your unique blockchain deposit address.
              </p>
              <Button onClick={handleCreateProxy} disabled={loading} variant="secondary">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Utility Address
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">
                  Your Unique Deposit Address
                </Label>
                <div className="flex gap-2">
                  <Input value={proxyAddress} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(proxyAddress)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">
                  Send Direct Deposit
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Amount (ARES)"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
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
      {/* Send Utility Credit - only if proxyAddress */}
      {proxyAddress && (
        <Card>
          <CardHeader>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Transfer</div>
            <CardTitle>Send Utility Credit</CardTitle>
            <CardDescription>
              Send ARES from your proxy balance directly to another user's wallet. A 5% network transfer fee applies.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">
                Recipient Address
              </Label>
              <Input
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Amount (ARES)</Label>
              <Input
                type="number"
                placeholder="0.0"
                min="0"
                step="1"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
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
            <Button
              className="w-full"
              onClick={handleTransfer}
              disabled={loading || transferAmountNum <= 0 || !recipient}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send Funds
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
