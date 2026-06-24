import { verifyAdmin } from "./auth";

export async function checkIsAdmin(address: string): Promise<boolean> {
  return verifyAdmin(address);
}
