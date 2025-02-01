import argon2 from "argon2";
import crypto from "crypto";

const SECRET_KEY = process.env.ENCRYPTION_KEY!; // Must be 32 bytes
const IV_LENGTH = 16; // AES block size

// Hash a password
export async function getHash(password: string): Promise<string> {
  return await argon2.hash(password);
}

// Verify a hashed password
export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  return await argon2.verify(hash, password);
}

// Encrypt text
export function encrypt(text: string): string {
  const key = crypto.createHash("sha256").update(SECRET_KEY).digest();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

// Decrypt text
export function decrypt(encryptedText: string): string {
  const key = crypto.createHash("sha256").update(SECRET_KEY).digest();
  const [ivHex, encryptedData] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
