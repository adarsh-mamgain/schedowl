import argon2 from "argon2";

export async function getHash(password: string): Promise<string> {
  return await argon2.hash(password);
}

export async function verifyPassword(
  inputPassword: string,
  storedPassword: string
): Promise<boolean> {
  return await argon2.verify(storedPassword, inputPassword);
}

const algorithm = "AES-CBC";

async function generateKey() {
  return crypto.subtle.generateKey({ name: algorithm, length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encrypt(text: string): Promise<string> {
  const key = await generateKey(); // Generate the key inside function
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encodedText = new TextEncoder().encode(text);
  const encrypted = await crypto.subtle.encrypt(
    { name: algorithm, iv },
    key,
    encodedText
  );

  return `${Buffer.from(iv).toString("hex")}:${Buffer.from(encrypted).toString(
    "hex"
  )}`;
}

export async function decrypt(encryptedText: string): Promise<string> {
  const key = await generateKey(); // Generate the key inside function
  const [ivHex, encrypted] = encryptedText.split(":");
  const iv = new Uint8Array(Buffer.from(ivHex, "hex"));
  const encryptedBuffer = Buffer.from(encrypted, "hex");

  const decrypted = await crypto.subtle.decrypt(
    { name: algorithm, iv },
    key,
    encryptedBuffer
  );

  return new TextDecoder().decode(decrypted);
}
