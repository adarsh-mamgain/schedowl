import bcrypt from "bcrypt";

export async function verifyPassword(
  inputPassword: string,
  storedPassword: string
) {
  return bcrypt.compare(inputPassword, storedPassword);
}
