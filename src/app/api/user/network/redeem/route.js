import { ethers } from "ethers";

import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  const walletAddress = verifyToken(request);
  if (!walletAddress) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userAddr = walletAddress.toLowerCase();
    const { destination } = await request.json(); // "metamask" or "utility"

    if (!destination || (destination !== "metamask" && destination !== "utility")) {
      return Response.json({ error: "Destination ('metamask' or 'utility') is required." }, { status: 400 });
    }

    // Use a transaction isolation strategy or execute a lock early:
    // Mark records as claimed FIRST inside a transaction before making any external on-chain calls.
    // If the on-chain call fails, we rollback the database transaction.
    // This blocks parallel calls because the records will already be updated/locked.
    
    let result = await prisma.$transaction(async (dbTx) => {
      // 1. Fetch and Lock unclaimed network earnings
      const unclaimed = await dbTx.networkEarning.findMany({
        where: {
          userAddress: userAddr,
          isClaimed: false,
        },
      });

      if (unclaimed.length === 0) {
        throw new Error("No available network matching earnings to redeem.");
      }

      const grossRedeemable = unclaimed.reduce((acc, curr) => acc + Number(curr.amount), 0);

      if (grossRedeemable <= 0) {
        throw new Error("Redeemable balance must be greater than zero.");
      }

      // Deduct flat 10%
      const fee = grossRedeemable * 0.10;
      const netRedeemable = grossRedeemable - fee;

      // Mark commissions as claimed immediately to prevent race condition / double spend
      const unclaimedIds = unclaimed.map((u) => u.id);
      await dbTx.networkEarning.updateMany({
        where: { id: { in: unclaimedIds } },
        data: {
          isClaimed: true,
        },
      });

      return {
        unclaimedIds,
        grossRedeemable,
        netRedeemable,
        fee,
      };
    });

    const { unclaimedIds, grossRedeemable, netRedeemable, fee } = result;
    let txHash = null;

    // 2. If MetaMask transfer on-chain
    if (destination === "metamask") {
      const signerPrivateKey =
        process.env.SIGNER_PRIVATE_KEY || "7f5d4d81e5a51efc4dab751d7e18889dd550d687eae7444a8bc1b37430d8565d";
      const rpcUrl = process.env.NEXT_PUBLIC_ARIES_RPC_URL || "https://rpc.arieschain.org";

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const serverWallet = new ethers.Wallet(signerPrivateKey, provider);

      console.log(
        `[Redeem Network] Sending net ${netRedeemable} ARES to wallet ${walletAddress}...`,
      );

      let tx;
      try {
        tx = await serverWallet.sendTransaction({
          to: walletAddress,
          value: ethers.parseEther(netRedeemable.toFixed(18)),
          gasPrice: ethers.parseUnits("1.5", "gwei"),
        });
        const receipt = await tx.wait();
        txHash = receipt.hash || tx.hash;
      } catch (txErr) {
        console.error("On-chain token transfer failed, rolling back DB state:", txErr);
        
        // ROLLBACK: Mark the records back as unclaimed
        await prisma.networkEarning.updateMany({
          where: { id: { in: unclaimedIds } },
          data: {
            isClaimed: false,
          },
        });

        return Response.json(
          { error: "Blockchain transaction rejected or server wallet out of funds. Contact admin." },
          { status: 500 },
        );
      }
    }

    // 3. Finalize ledger entries and tx hash updates
    await prisma.$transaction(async (dbTx) => {
      // Update txHash for the updated network earnings
      if (txHash) {
        await dbTx.networkEarning.updateMany({
          where: { id: { in: unclaimedIds } },
          data: { txHash },
        });
      }

      // Record a LedgerEntry for network redemption for audit trail
      await dbTx.ledgerEntry.create({
        data: {
          userAddress: userAddr,
          type: destination === "metamask" ? "NETWORK_REDEEM_METAMASK" : "NETWORK_REDEEM_UTILITY",
          amount: grossRedeemable,
          netAmount: netRedeemable,
          fee: fee,
          description: `Redeemed network matching earnings of ${grossRedeemable.toFixed(2)} ARES to ${
            destination === "metamask" ? "MetaMask" : "Utility Wallet"
          } (10% Fee deducted).`,
          txHash,
          timestamp: new Date(),
        },
      });
    });

    return Response.json({
      success: true,
      amount: netRedeemable,
      grossAmount: grossRedeemable,
      fee,
      destination,
      txHash,
    });
  } catch (err) {
    console.error("Failed to redeem network earnings:", err.message);
    return Response.json({ error: err.message || "Redemption failed" }, { status: 500 });
  }
}
