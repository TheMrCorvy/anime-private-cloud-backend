import { generateApiKey, verifyApiKey, generateApiKeyWithPrefix, ApiKey } from '../src/services/apiKeyService';

describe('apiKeyService', () => {
    describe('generateApiKey', () => {
        it('should generate an API key with default length (32 bytes)', async () => {
            const apiKey = await generateApiKey();

            expect(apiKey).toBeDefined();
            expect(apiKey.key).toBeDefined();
            expect(apiKey.hash).toBeDefined();
            expect(apiKey.createdAt).toBeInstanceOf(Date);

            expect(apiKey.key).toHaveLength(64);
            expect(typeof apiKey.hash).toBe('string');
        });

        it('should generate an API key with custom length', async () => {
            const customLength = 16;
            const apiKey = await generateApiKey(customLength);

            expect(apiKey.key).toHaveLength(customLength * 2);
            expect(typeof apiKey.hash).toBe('string');
        });

        it('should generate different keys on subsequent calls', async () => {
            const apiKey1 = await generateApiKey();
            const apiKey2 = await generateApiKey();

            expect(apiKey1.key).not.toBe(apiKey2.key);
            expect(apiKey1.hash).not.toBe(apiKey2.hash);
        });

        it('should generate valid hex strings', async () => {
            const apiKey = await generateApiKey();

            expect(/^[a-f0-9]+$/i.test(apiKey.key)).toBe(true);
        });

        it('should have createdAt timestamp close to current time', async () => {
            const before = new Date();
            const apiKey = await generateApiKey();
            const after = new Date();

            expect(apiKey.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(apiKey.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
        });
    });

    describe('verifyApiKey', () => {
        it('should verify a valid API key against its hash', async () => {
            const apiKey = await generateApiKey();
            const isValid = await verifyApiKey(apiKey.key, apiKey.hash);

            expect(isValid).toBe(true);
        });

        it('should reject an invalid API key', async () => {
            const apiKey = await generateApiKey();
            const wrongKey = 'invalid_key';
            const isValid = await verifyApiKey(wrongKey, apiKey.hash);

            expect(isValid).toBe(false);
        });

        it('should reject when hash is invalid', async () => {
            const apiKey = await generateApiKey();
            const wrongHash = 'invalid_hash';
            const isValid = await verifyApiKey(apiKey.key, wrongHash);

            expect(isValid).toBe(false);
        });

        it('should be case sensitive', async () => {
            const apiKey = await generateApiKey();
            const upperCaseKey = apiKey.key.toUpperCase();
            const isValid = await verifyApiKey(upperCaseKey, apiKey.hash);

            expect(isValid).toBe(false);
        });

        it('should handle empty strings', async () => {
            const apiKey = await generateApiKey();

            expect(await verifyApiKey('', apiKey.hash)).toBe(false);
            expect(await verifyApiKey(apiKey.key, '')).toBe(false);
            expect(await verifyApiKey('', '')).toBe(false);
        });
    });

    describe('generateApiKeyWithPrefix', () => {
        it('should generate API key with default prefix', async () => {
            const apiKey = await generateApiKeyWithPrefix();

            expect(apiKey.key).toMatch(/^apc_[a-f0-9]{64}$/);
            expect(typeof apiKey.hash).toBe('string');
            expect(apiKey.createdAt).toBeInstanceOf(Date);
        });

        it('should generate API key with custom prefix', async () => {
            const customPrefix = 'myapp_';
            const apiKey = await generateApiKeyWithPrefix(customPrefix);

            expect(apiKey.key).toMatch(new RegExp(`^${customPrefix}[a-f0-9]{64}$`));
        });

        it('should generate API key with custom prefix and length', async () => {
            const customPrefix = 'test_';
            const customLength = 16;
            const apiKey = await generateApiKeyWithPrefix(customPrefix, customLength);

            expect(apiKey.key).toMatch(new RegExp(`^${customPrefix}[a-f0-9]{${customLength * 2}}$`));
        });

        it('should handle empty prefix', async () => {
            const apiKey = await generateApiKeyWithPrefix('');

            expect(apiKey.key).toMatch(/^[a-f0-9]{64}$/);
            expect(apiKey.key).not.toMatch(/^_/);
        });

        it('should generate different keys with same prefix', async () => {
            const prefix = 'same_';
            const apiKey1 = await generateApiKeyWithPrefix(prefix);
            const apiKey2 = await generateApiKeyWithPrefix(prefix);

            expect(apiKey1.key).not.toBe(apiKey2.key);
            expect(apiKey1.key.startsWith(prefix)).toBe(true);
            expect(apiKey2.key.startsWith(prefix)).toBe(true);
        });

        it('should verify prefixed API keys correctly', async () => {
            const apiKey = await generateApiKeyWithPrefix('prefix_');
            const isValid = await verifyApiKey(apiKey.key, apiKey.hash);

            expect(isValid).toBe(true);
        });

        it('should handle special characters in prefix', async () => {
            const specialPrefix = 'app-v2.1_';
            const apiKey = await generateApiKeyWithPrefix(specialPrefix);

            expect(apiKey.key.startsWith(specialPrefix)).toBe(true);
            expect(await verifyApiKey(apiKey.key, apiKey.hash)).toBe(true);
        });
    });

    describe('ApiKey interface', () => {
        it('should have all required properties', async () => {
            const apiKey = await generateApiKey();

            expect(typeof apiKey.key).toBe('string');
            expect(typeof apiKey.hash).toBe('string');
            expect(apiKey.createdAt).toBeInstanceOf(Date);
        });
    });
});
