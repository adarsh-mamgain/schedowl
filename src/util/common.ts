import bcrypt from "bcrypt";

export async function getHash(password: string): Promise<string> {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export async function verifyPassword(
  inputPassword: string,
  storedPassword: string
): Promise<boolean> {
  return bcrypt.compareSync(inputPassword, storedPassword);
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
