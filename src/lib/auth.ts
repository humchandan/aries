import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';

const JWT_SECRET = process.env.JWT_SECRET || 'aries_mlm_super_secret_jwt_key_12345';

export function signToken(walletAddress: string) {
  return jwt.sign({ walletAddress: walletAddress.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.split(' ')[1];
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
