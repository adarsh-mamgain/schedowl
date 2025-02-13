import { compare, hash } from "bcryptjs";
import { JWTPayload, jwtVerify, JWTVerifyResult, SignJWT } from "jose";

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET_KEY);

export async function hashPassword(password: string) {
  return hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

export async function generateJWT(tokenPayload: JWTPayload) {
  return await new SignJWT(tokenPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifyJWT(
  token: string
): Promise<JWTVerifyResult<JWTPayload>> {
  return await jwtVerify(token, SECRET_KEY);
}
