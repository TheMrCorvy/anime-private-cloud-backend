import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';

export interface ApiKey {
    key: string;
    hash: string;
    createdAt: Date;
}

/**
 * Generates a secure API key and hashes it with bcrypt
 * @param length - Key length in bytes (default 32)
 * @returns Object with the key, its hash, and creation date
 */
export const generateApiKey = async (length: number = 32): Promise<ApiKey> => {
    const randomBuffer = randomBytes(length);
    const key = randomBuffer.toString('hex');
    const hash = await bcrypt.hash(key, 12);

    return {
        key,
        hash,
        createdAt: new Date(),
    };
};

/**
 * Verifies if an API key is valid by comparing with its bcrypt hash
 * @param key - The key to verify
 * @param hash - The stored hash
 * @returns true if the key is valid
 */
export const verifyApiKey = async (key: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(key, hash);
};

/**
 * Generates an API key with a custom prefix and hashes it with bcrypt
 * @param prefix - Prefix for the key (e.g., 'apc_')
 * @param length - Length of the random part
 * @returns ApiKey object with prefix
 */
export const generateApiKeyWithPrefix = async (prefix: string = 'apc_', length: number = 32): Promise<ApiKey> => {
    const baseKey = await generateApiKey(length);
    const prefixedKey = `${prefix}${baseKey.key}`;
    const hash = await bcrypt.hash(prefixedKey, 12);

    return {
        ...baseKey,
        key: prefixedKey,
        hash,
    };
};
