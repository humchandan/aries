"use client";

import React, { useEffect, useState } from "react";

import { ethers } from "ethers";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWeb3 } from "@/hooks/useWeb3";
import { waitForTransactionReceiptWithRetry } from "@/lib/txWaiter";

export function MappedAccounts() {
  const { userAddress, jwtToken, userProfile, provider, signer, loadProfile } = useWeb3();
  const [proxyAddress, setProxyAddress] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  const CUSTODY_WALLET_ADDRESS = "0xD01c1BFC96E22A9470C186E69E0A97e18EfF23e6";

  const loadLedgerAndProxy = async () => {
    if (!jwtToken || !userAddress) return;
    try {
      const balanceRes = await fetch(`/api/ledger/balance`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      const balanceData = await balanceRes.json();
      setBalance(balanceData.balance || 0);

      if (userProfile && userProfile.proxyAddress) {
        setProxyAddress(userProfile.proxyAddress);
      }
    } catch (err) {
      console.error("Failed to load ledger/proxy details:", err);
    }
  };

  useEffect(() => {
    loadLedgerAndProxy();
  }, [jwtToken, userAddress, userProfile, provider]);

  const handleCreateProxy = async () => {
    if (!signer) return;
    try {
      setLoading(true);
      alert("Generating your private utility wallet...");
      const supportResponse = await fetch("/contracts/PortalFactory.json");
      const supportData = await supportResponse.json();
      const factoryContract = new ethers.Contract(supportData.address, supportData.abi, signer);
      const userId = ethers.keccak256(ethers.toUtf8Bytes("portal_user_" + userAddress!.toLowerCase()));

      const tx = await factoryContract.createPortal(userId, { gasPrice: ethers.parseUnits("1.5", "gwei") });
      const receipt = await waitForTransactionReceiptWithRetry((signer.provider || provider)!, tx.hash);

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
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` },
          body: JSON.stringify({ proxyAddress: proxyAddr }),
        });
        await loadProfile();
        setProxyAddress(proxyAddr);
        alert("Proxy wallet deployed and profile updated successfully!");
      }
    } catch (err: any) {
      console.error("Factory deploy failed:", err);
      alert(err.reason || err.message || "Factory deployment failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDepositProxy = async () => {
    if (!signer || !proxyAddress) return;
    const amount = parseFloat(depositAmount) || 0;
    if (amount <= 0) return;
    try {
      setLoading(true);
      const tx = await signer.sendTransaction({
        to: proxyAddress,
        value: ethers.parseEther(amount.toString()),
        gasPrice: ethers.parseUnits("1.5", "gwei"),
      });
      await waitForTransactionReceiptWithRetry((signer.provider || provider)!, tx.hash);
      alert(`Successfully deposited ${amount} ARES!`);
      setDepositAmount("");
      loadLedgerAndProxy();
    } catch (err: any) {
      alert(err.message || "Deposit failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (userProfile?.isBanned) {
      alert("Your account has been restricted. Transfers are disabled.");
      return;
    }
    if (!recipient || !transferAmount) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/ledger/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({ recipient, amount: transferAmount }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully sent utility credit!`);
        setRecipient("");
        setTransferAmount("");
        loadLedgerAndProxy();
      } else {
        alert(data.error || "Transfer failed.");
      }
    } catch (err) {
      alert("Transfer failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Your Wallet</CardTitle>
          <CardDescription>Available Balance: {balance.toFixed(2)} ARES</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!proxyAddress ? (
            <div className="flex flex-col gap-2 items-start">
              <p className="text-sm text-muted-foreground">
                No Utility Wallet Found. Generate one to receive deposits.
              </p>
              <Button onClick={handleCreateProxy} disabled={loading || !signer}>
                {loading ? "Generating..." : "Create Utility Address"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Your Deposit Address</label>
                <div className="flex gap-2">
                  <Input readOnly value={proxyAddress} />
                  <Button variant="secondary" onClick={() => navigator.clipboard.writeText(proxyAddress)}>
                    Copy
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Direct Deposit (ARES)</label>
                <div className="flex gap-2">
                  <Input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
                  <Button onClick={handleDepositProxy} disabled={loading || !signer}>
                    Deposit
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {proxyAddress && (
        <Card>
          <CardHeader>
            <CardTitle>Transfer Credits</CardTitle>
            <CardDescription>Send ARES internally to another user.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Recipient Wallet</label>
              <Input placeholder="0x..." value={recipient} onChange={(e) => setRecipient(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Amount</label>
              <Input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleTransfer} disabled={loading || !signer}>
              {loading ? "Sending..." : "Send Funds"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
