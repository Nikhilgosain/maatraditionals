import { SignJWT, jwtVerify } from 'jose';
import { JwtPayload } from 'jsonwebtoken';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export const signJwtToken = async (payload: JwtPayload, expiresIn = '7d') => {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
  return jwt;
};

export const verifyJwtToken = async (token: string) => {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (err) {
    console.log('❌ Error verifying token:', err);
    return null;
  }
};
