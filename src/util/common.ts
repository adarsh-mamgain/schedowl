import { scryptSync, randomBytes } from "crypto";

const salt = randomBytes(16).toString("hex");

export const getHash = (payload: string) =>
  scryptSync(payload, salt, 32).toString("hex");

export const verifyPassword = async (
  inputPassword: string,
  storedPassword: string
) => {
  return getHash(inputPassword) === storedPassword;
};
