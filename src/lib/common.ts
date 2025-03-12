import crypto from "crypto";

// Configuration for encryption
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16; // For AES, this is always 16
const ENCRYPTION_ALGORITHM = "aes-256-cbc";

/**
 * Encrypts a string using AES-256-CBC
 * @param text The text to encrypt
 * @returns Base64 encoded encrypted string
 */
export function encrypt(text: string): string {
  try {
    // Create a random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      iv
    );

    // Encrypt the text
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Combine IV and encrypted text
    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Encryption failed");
  }
}

/**
 * Decrypts a string encrypted with the corresponding encrypt function
 * @param encryptedText Base64 encoded encrypted string
 * @returns Decrypted string
 */
export function decrypt(encryptedText: string): string {
  try {
    // Split IV and encrypted text
    const textParts = encryptedText.split(":");
    const iv = Buffer.from(textParts[0], "hex");
    const encryptedData = textParts[1];

    // Create decipher
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      iv
    );

    // Decrypt the text
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Decryption failed");
  }
}

export function generateUniqueSlug(name: string): string {
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const timestamp = Date.now().toString(36);
  return `${baseSlug}-${timestamp}`;
}
