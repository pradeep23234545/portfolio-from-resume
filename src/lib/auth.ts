import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const DEV_FALLBACK_SECRET = 'dev-only-secret-do-not-use-in-production';

/**
 * The secret that signs login cookies. In production it must be set: the dev
 * fallback is public in the source code, so anyone could forge a login with it.
 * Checked when used (not at import) so builds work without the variable.
 */
function getSecret() {
    const secret = process.env.JWT_SECRET;
    if (secret && secret.length >= 16 && !/replace-with|your-|your_/i.test(secret)) {
        return new TextEncoder().encode(secret);
    }
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is missing or too short. Set a long random value in your hosting environment variables.');
    }
    return new TextEncoder().encode(DEV_FALLBACK_SECRET);
}
const JWT_EXPIRES_IN = '7d';

export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export async function signJWT(payload: any): Promise<string> {
    const secret = getSecret();
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRES_IN)
        .sign(secret);
}

export async function verifyJWT(token: string): Promise<any> {
    const secret = getSecret(); // throws in production if unset, instead of accepting forged tokens
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (error) {
        return null;
    }
}
