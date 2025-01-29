import bcrypt from "bcryptjs";
// import crypto from "crypto";

export function getHash(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function verifyPassword(
  inputPassword: string,
  storedPassword: string
): boolean {
  return bcrypt.compareSync(inputPassword, storedPassword);
}

// const algorithm = "aes-256-cbc";
// const key = crypto.randomBytes(32);
// const iv = crypto.randomBytes(16);

// export function encrypt(text: string): string {
//   const cipher = crypto.createCipheriv(algorithm, key, iv);
//   let encrypted = cipher.update(text, "utf8", "hex");
//   encrypted += cipher.final("hex");
//   return `${iv.toString("hex")}:${encrypted}`;
// }

// export function decrypt(encryptedText: string): string {
//   const [ivHex, encrypted] = encryptedText.split(":");
//   const ivBuffer = Buffer.from(ivHex, "hex");
//   const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);
//   let decrypted = decipher.update(encrypted, "hex", "utf8");
//   decrypted += decipher.final("utf8");
//   return decrypted;
// }
