import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hashes a plain text password using bcrypt.
 * @param password The plain text password to hash.
 * @returns A promise that resolves to the hashed password.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a plain text password with a hashed password.
 * @param password The plain text password to check.
 * @param hash The hashed password to compare against.
 * @returns A promise that resolves to true if the password matches the hash, false otherwise.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Checks if a string is likely a bcrypt hash.
 * @param password The string to check.
 * @returns True if the string follows the bcrypt hash format, false otherwise.
 */
export function isHashed(password: string): boolean {
  // Bcrypt hashes typically start with $2a$, $2b$, or $2y$ followed by the cost and the salt/hash.
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(password);
}
