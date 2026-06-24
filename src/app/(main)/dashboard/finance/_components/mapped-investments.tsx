"use client";

import React, { useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "@/hooks/useWeb3";
import { waitForTransactionReceiptWithRetry } from "@/lib/txWaiter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Zap } from "lucide-react";

export function MappedInvestments() {
  const { jwtToken, provider, signer, loadProfile } = useWeb3();

  const [purchaseAmount, setPurchaseAmount] = useState<string | number>("");
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [txLoading, setTxLoading] = useState(false);

  const handleBuyPlan = async () => {
    if (!signer) {
      alert("Please connect your wallet first.");
      return;
    }
    const val = parseFloat(purchaseAmount.toString()) || 0;
    if (val < 100) {
      alert("Minimum purchase plan size is 100 ARES.");
      return;
    }
    if (val % 100 !== 0) {
      alert("Plan size must be in multiples of 100 ARES.");
      return;
    }

    try {
      setTxLoading(true);

      // Load portal address/abi
      const res = await fetch("/contracts/AriesSupportPortal.json");
      if (!res.ok) {
        throw new Error("Failed to load contract details");
      }
      const supportData = await res.json();
      const portalContract = new ethers.Contract(
        supportData.address,
        supportData.abi,
        signer
      );

      const valueWei = ethers.parseEther(val.toString());
      const tx = await portalContract.purchasePlan({
        value: valueWei,
        gasPrice: ethers.parseUnits("1.5", "gwei"),
      });

      const receipt = await waitForTransactionReceiptWithRetry(
        (signer.provider || provider)!,
        tx.hash
      );

      // Submit to backend
      const dbRes = await fetch("/api/user/stake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          txHash: receipt.hash || tx.hash,
          amount: val.toString(),
        }),
      });

      if (!dbRes.ok) {
        const dbData = await dbRes.json();
        throw new Error(dbData.error || "Failed to register plan in database.");
      }

      alert(`Successfully purchased plan of ${val.toLocaleString()} ARES!`);
      setPurchaseAmount("");
      setActivePreset(null);
      await loadProfile();
    } catch (err: any) {
      console.error("Purchase failed:", err);
      alert(err.message || "Purchase failed");
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <CardTitle>Buy Validation Plan</CardTitle>
        </div>
        <CardDescription>
          Deposit native ARES to buy a support plan. Earn 8.5% monthly yield and unlock MLM matching commissions.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-3 gap-2">
          {[1000, 5000, 10000].map((preset) => (
            <Button
              key={preset}
              variant={activePreset === preset ? "default" : "outline"}
              onClick={() => {
                setPurchaseAmount(preset);
                setActivePreset(preset);
              }}
              className="w-full text-xs font-semibold"
            >
              {preset.toLocaleString()} ARES
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 uppercase text-muted-foreground tracking-wider">
            Custom Amount
          </label>
          <div className="relative">
            <Input
              type="number"
              placeholder="Min 100 ARES"
              min="100"
              step="100"
              value={purchaseAmount}
              onChange={(e) => {
                setPurchaseAmount(e.target.value);
                setActivePreset(null);
              }}
              className="pr-16"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
              ARES
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Must be 100 ARES or higher, in increments of 100.
          </p>
        </div>

        <Button
          className="w-full font-semibold"
          size="lg"
          onClick={handleBuyPlan}
          disabled={txLoading}
        >
          {txLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
            </>
          ) : (
            "Buy Validation Plan"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
