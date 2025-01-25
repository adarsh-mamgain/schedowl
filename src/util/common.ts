import bcrypt from "bcryptjs";

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
