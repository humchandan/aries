"use client";

import * as React from "react";

import { ethers } from "ethers";
import { Info, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWeb3 } from "@/hooks/useWeb3";

export function MappedWithdrawals() {
  const { userAddress, userProfile, provider, signer, jwtToken, loadProfile } = useWeb3();
  const [accruedRewards, setAccruedRewards] = React.useState(0);
  const [withdrawalType, setWithdrawalType] = React.useState<"metamask" | "utility">("metamask");
  const [txLoading, setTxLoading] = React.useState(false);

  React.useEffect(() => {
    if (!userAddress || !userProfile) return;

    const selfInvestment = parseFloat(userProfile.selfInvestment) || 0;
    const baseYield = parseFloat(userProfile.yieldBalance) || 0;
    const lastAccruedStr = userProfile.lastYieldAccruedAt;

    if (selfInvestment <= 0) {
      setAccruedRewards(baseYield);
      return;
    }

    const lastAccruedTime = lastAccruedStr ? new Date(lastAccruedStr).getTime() : Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - lastAccruedTime) / 1000));
    const ratePerSec = (selfInvestment * 0.085) / 2592000.0;

    const totalClaimed = parseFloat(userProfile.totalClaimed) || 0;
    const maxLimit = selfInvestment * 2.5;

    let initialAccrued = baseYield + elapsedSeconds * ratePerSec;
    if (totalClaimed + initialAccrued > maxLimit) {
      initialAccrued = maxLimit - totalClaimed;
    }

    setAccruedRewards(initialAccrued);

    const interval = setInterval(() => {
      setAccruedRewards((prev) => {
        let nextVal = prev + ratePerSec;
        if (totalClaimed + nextVal > maxLimit) {
          nextVal = Math.max(0, maxLimit - totalClaimed);
        }
        return nextVal;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [userAddress, userProfile]);

  const handleClaimRewards = async () => {
    if (userProfile?.isBanned) {
      toast.error("Your account has been restricted. Withdrawals are disabled.");
      return;
    }
    if (!userAddress || !userProfile) {
      toast.error("Please connect your wallet first.");
      return;
    }
    if (accruedRewards <= 0) {
      toast.error("No accrued rewards available to claim.");
      return;
    }

    if (withdrawalType === "metamask") {
      if (accruedRewards < 100.0) {
        toast.error("You must have at least 100 ARES accrued to withdraw to MetaMask.");
        return;
      }
      if (!userProfile.proxyAddress) {
        toast.error("Please create a utility wallet address first in the Utility Portal tab.");
        return;
      }
      if (provider) {
        try {
          const code = await provider.getCode(userProfile.proxyAddress);
          if (code === "0x" || code === "0x00") {
            toast.error("Your utility wallet contract is not deployed on-chain.");
            return;
          }
        } catch (codeErr) {
          console.error("Failed to verify proxy wallet deployment:", codeErr);
        }
      }

      try {
        setTxLoading(true);
        toast.info("Generating secure backend verification signature...");

        const claimSignRes = await fetch("/api/ledger/claims/sign", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({ accruedAmount: accruedRewards }),
        });
        const claimSignData = await claimSignRes.json();

        if (!claimSignRes.ok || !claimSignData.success) {
          throw new Error(claimSignData.error || "Failed to sign claim on server.");
        }

        const { signature, newTotalEligible, deadline, claimableAmount, portalAddress } = claimSignData;

        toast.info("Submitting claim transaction to blockchain. Confirm in MetaMask...");

        const portalJsonRes = await fetch("/contracts/AriesSupportPortal.json");
        const portalJson = await portalJsonRes.json();
        const portalContract = new ethers.Contract(portalAddress, portalJson.abi, signer);

        const tx = await portalContract.claimRewards(userProfile.proxyAddress, newTotalEligible, deadline, signature, {
          gasPrice: ethers.parseUnits("1.5", "gwei"),
        });

        toast.info("Waiting for transaction confirmation...");
        const receipt = await tx.wait();

        toast.info("Registering claim in database...");
        const recordRes = await fetch("/api/ledger/claims/record", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({
            txHash: receipt.hash || tx.hash,
            amount: claimableAmount.toString(),
          }),
        });
        const recordData = await recordRes.json();
        if (!recordRes.ok) {
          throw new Error(recordData.error || "Failed to register claim in database.");
        }

        toast.success("Claim complete! Payout split 50/50 after 10% fee.");
        await loadProfile();
      } catch (err: any) {
        console.error("Claim failed:", err);
        toast.error(err.message || "An error occurred during the claim process.");
      } finally {
        setTxLoading(false);
      }
    } else {
      try {
        setTxLoading(true);
        toast.info("Submitting claim to utility portal database...");

        const claimRes = await fetch("/api/ledger/claims", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({ amount: accruedRewards }),
        });
        const claimData = await claimRes.json();

        if (!claimRes.ok) {
          throw new Error(claimData.error || "Utility claim API error.");
        }

        toast.success(
          `Claim complete! ${parseFloat(claimData.claimedAmount).toFixed(2)} ARES credited to Utility Wallet.`,
        );
        await loadProfile();
      } catch (err: any) {
        console.error("Utility claim failed:", err);
        toast.error(err.message || "An error occurred during the utility claim.");
      } finally {
        setTxLoading(false);
      }
    }
  };

  const adminFee = accruedRewards * 0.1;
  const netClaimed = accruedRewards - adminFee;
  const metamaskShare = netClaimed * 0.5;
  const utilityShare = netClaimed - metamaskShare;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-normal text-xl">Withdrawal Center</CardTitle>
        <CardDescription>
          {withdrawalType === "metamask"
            ? "Claims split 50/50: 50% to MetaMask and 50% to your utility account (minus 10% admin fee)."
            : "Claims go 100% directly to your off-chain Utility Portal account balance (minus 10% admin fee)."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between">
        <Tabs
          defaultValue="metamask"
          onValueChange={(v) => setWithdrawalType(v as "metamask" | "utility")}
          className="mb-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="metamask">MetaMask Split</TabsTrigger>
            <TabsTrigger value="utility">Utility Wallet</TabsTrigger>
          </TabsList>

          <div className="mt-6 p-6 rounded-xl border bg-zinc-950/50 text-center">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Accrued Rewards</div>
            <div className="text-4xl font-semibold text-white tracking-tight tabular-nums font-mono">
              {accruedRewards.toFixed(6)}
            </div>
            <div className="text-sm text-zinc-500 font-mono mt-1">ARES</div>
          </div>

          <div
            className={`mt-4 flex items-start gap-3 p-4 rounded-xl border text-sm ${withdrawalType === "metamask" ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}
          >
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {withdrawalType === "metamask"
                ? "Min 100 ARES accrued. Payout splits 50/50 net of 10% fee."
                : "Instant claim of any amount, limited to 4 claims per month."}
            </p>
          </div>

          {accruedRewards > 0 && userProfile?.selfInvestment && parseFloat(userProfile.selfInvestment) > 0 && (
            <div className="mt-6 space-y-2">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                Estimated Distribution
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Admin Fee (10%)</span>
                <span className="font-mono text-red-400">-{adminFee.toFixed(6)}</span>
              </div>

              {withdrawalType === "metamask" ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">→ MetaMask (50%)</span>
                    <span className="font-mono text-emerald-400">+{metamaskShare.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">→ Utility (50%)</span>
                    <span className="font-mono text-cyan-400">+{utilityShare.toFixed(6)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">→ Utility Wallet (100%)</span>
                  <span className="font-mono text-emerald-400">+{netClaimed.toFixed(6)}</span>
                </div>
              )}
            </div>
          )}
        </Tabs>

        <Button
          className="w-full mt-4 h-12 text-base font-semibold"
          onClick={handleClaimRewards}
          disabled={txLoading}
          variant={withdrawalType === "metamask" ? "default" : "secondary"}
        >
          {txLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : withdrawalType === "metamask" ? (
            "Claim Split Payout"
          ) : (
            "Claim to Utility Wallet"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
