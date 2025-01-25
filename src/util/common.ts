import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hashedPassword = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hashedPassword}`;
};

export const verifyPassword = (
  inputPassword: string,
  storedPassword: string
) => {
  const [salt, hashedPassword] = storedPassword.split(":");
  const inputHash = scryptSync(inputPassword, salt, 32).toString("hex");
  return timingSafeEqual(Buffer.from(inputHash), Buffer.from(hashedPassword));
};
