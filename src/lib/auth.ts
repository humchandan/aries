import { ethers } from "ethers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "aries_mlm_super_secret_jwt_key_12345";

export function signToken(walletAddress: string) {
  return jwt.sign({ walletAddress: walletAddress.toLowerCase() }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & { walletAddress: string };
    return decoded.walletAddress.toLowerCase();
  } catch (err) {
    return null;
  }
}

export function verifySignature(walletAddress: string, signature: string, challenge: string) {
  try {
    const recoveredAddress = ethers.verifyMessage(challenge, signature);
    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
  } catch (err) {
    return false;
  }
}

export async function verifyAdmin(walletAddress: string | null): Promise<boolean> {
  if (!walletAddress) return false;

  const envAdmin = process.env.ADMIN_WALLET || process.env.NEXT_PUBLIC_ADMIN_WALLET;
  const hardcodedAdmin = "0x5Ed6484123dA3dec1834CD472E1ca6b53e97c7B6";
  const fallbackAdmin = envAdmin || hardcodedAdmin;

  if (fallbackAdmin && fallbackAdmin.toLowerCase() === walletAddress.toLowerCase()) {
    return true;
  }

  try {
    const PortalFactoryArtifact = await import("../../public/contracts/PortalFactory.json");
    const rpc = process.env.NEXT_PUBLIC_ARIES_RPC_URL || "https://rpc.arieschain.org";
    const provider = new ethers.JsonRpcProvider(rpc);
    const contract = new ethers.Contract(
      PortalFactoryArtifact.default?.address || PortalFactoryArtifact.address,
      PortalFactoryArtifact.default?.abi || PortalFactoryArtifact.abi,
      provider,
    );
    const owner = await contract.owner();
    return owner.toLowerCase() === walletAddress.toLowerCase();
  } catch (err) {
    console.error("verifyAdmin error:", err);
    return false;
  }
}
