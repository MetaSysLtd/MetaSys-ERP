import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

/**
 * Hash a plain text password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Password hashing failed');
  }
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('Error comparing password:', error);
    throw new Error('Password comparison failed');
  }
}

/**
 * Check if a password needs to be rehashed (for migration purposes)
 */
export function isPasswordHashed(password: string): boolean {
  // bcrypt hashes start with $2a$, $2b$, or $2y$
  return /^\$2[ayb]\$\d+\$/.test(password);
}

/**
 * Migrate plain text password to hashed password
 */
export async function migratePasswordIfNeeded(plainTextPassword: string): Promise<string> {
  if (isPasswordHashed(plainTextPassword)) {
    return plainTextPassword; // Already hashed
  }
  
  console.log('Migrating plain text password to bcrypt hash');
  return await hashPassword(plainTextPassword);
}