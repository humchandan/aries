import { checkIsAdmin } from "@/lib/admin";
import { verifyToken } from "@/lib/auth";

export async function POST(request) {
  const walletAddress = verifyToken(request);
  if (!walletAddress || !(await checkIsAdmin(walletAddress))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { pin } = await request.json();

    // Read the secure PIN from .env (fallback to a default secure PIN if not defined)
    const securePin = process.env.ADMIN_BLOCKCHAIN_PIN || "ARES-ADMIN-SECURE-2026";

    if (pin === securePin) {
      return Response.json({ success: true });
    }
    return Response.json({ error: "Invalid PIN code" }, { status: 400 });
  } catch (err) {
    console.error("Failed to verify admin pin:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
