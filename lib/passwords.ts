import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const keyLength = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await scryptAsync(password, salt, keyLength)) as Buffer;

  return `scrypt:${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, passwordHash: string | null) {
  if (!passwordHash) {
    return false;
  }

  const [algorithm, salt, storedKey] = passwordHash.split(":");

  if (algorithm !== "scrypt" || !salt || !storedKey) {
    return false;
  }

  const key = (await scryptAsync(password, salt, keyLength)) as Buffer;
  const storedKeyBuffer = Buffer.from(storedKey, "hex");

  if (key.length !== storedKeyBuffer.length) {
    return false;
  }

  return timingSafeEqual(key, storedKeyBuffer);
}
