import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET
);

interface JWTPayload {
    [key: string]: string | number | boolean | null | undefined;
}

export async function createToken(payload: JWTPayload): Promise<string> {
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(JWT_SECRET);
    
    return token;
}