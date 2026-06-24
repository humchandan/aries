import { ethers } from "ethers";

import { checkIsAdmin } from "@/lib/admin";
import { verifyToken } from "@/lib/auth";

export async function GET(request) {
  const walletAddress = verifyToken(request);
  if (!walletAddress || !(await checkIsAdmin(walletAddress))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const signerKey = process.env.SIGNER_PRIVATE_KEY;
    if (!signerKey) {
      return Response.json({ error: "Signer key is not configured in backend .env" }, { status: 500 });
    }

    const wallet = new ethers.Wallet(signerKey);
    const derivedSignerAddress = wallet.address;

    return Response.json({
      success: true,
      derivedSignerAddress,
    });
  } catch (err) {
    console.error("Failed to verify signer:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
