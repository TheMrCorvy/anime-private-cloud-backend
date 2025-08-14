import { Request, Response, NextFunction } from 'express';
import { authenticateApiKey, authenticateApiKeyWithHashes } from '../src/middleware/apiKeyAuth';
import { generateApiKey } from '../src/services/apiKeyService';

type MockRequest = Partial<Request> & {
    headers: { [key: string]: string | undefined };
    apiKey?: string;
};

type MockResponse = Partial<Response> & {
    status: jest.Mock;
    json: jest.Mock;
};

describe('apiKeyAuth middleware', () => {
    let mockRequest: MockRequest;
    let mockResponse: MockResponse;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockRequest = {
            headers: {},
            query: {},
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
    });

    describe('authenticateApiKey', () => {
        const validApiKeys = ['valid_key_1', 'valid_key_2'];

        it('should authenticate with valid API key in x-api-key header', () => {
            mockRequest.headers['x-api-key'] = 'valid_key_1';

            const middleware = authenticateApiKey(validApiKeys);
            middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRequest.apiKey).toBe('valid_key_1');
            expect(mockResponse.status).not.toHaveBeenCalled();
            expect(mockResponse.json).not.toHaveBeenCalled();
        });

        it('should authenticate with valid API key in authorization header', () => {
            mockRequest.headers['authorization'] = 'Bearer valid_key_2';

            const middleware = authenticateApiKey(validApiKeys);
            middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRequest.apiKey).toBe('valid_key_2');
        });

        it('should prioritize x-api-key over authorization header', () => {
            mockRequest.headers['x-api-key'] = 'valid_key_1';
            mockRequest.headers['authorization'] = 'Bearer valid_key_2';

            const middleware = authenticateApiKey(validApiKeys);
            middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRequest.apiKey).toBe('valid_key_1');
        });

        it('should return 401 when no API key is provided', () => {
            const middleware = authenticateApiKey(validApiKeys);
            middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'API key required',
                message: 'Provide a valid API key in the x-api-key or authorization header',
            });
        });

        it('should return 403 when API key is invalid', () => {
            mockRequest.headers['x-api-key'] = 'invalid_key';

            const middleware = authenticateApiKey(validApiKeys);
            middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Invalid API key',
                message: 'The provided API key is not valid',
            });
        });

        it('should handle empty valid keys array', () => {
            mockRequest.headers['x-api-key'] = 'any_key';

            const middleware = authenticateApiKey([]);
            middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
        });

        it('should handle authorization header without Bearer prefix', () => {
            mockRequest.headers['authorization'] = 'valid_key_1';

            const middleware = authenticateApiKey(validApiKeys);
            middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRequest.apiKey).toBe('valid_key_1');
        });

        it('should handle empty authorization header', () => {
            mockRequest.headers['authorization'] = '';

            const middleware = authenticateApiKey(validApiKeys);
            middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(401);
        });

        it('should be case sensitive for API keys', () => {
            mockRequest.headers['x-api-key'] = 'VALID_KEY_1';

            const middleware = authenticateApiKey(['valid_key_1']);
            middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
        });
    });

    describe('authenticateApiKeyWithHashes', () => {
        let testApiKey: any;
        let mockGetValidHashes: jest.Mock;

        beforeEach(async () => {
            testApiKey = await generateApiKey();
            mockGetValidHashes = jest.fn();
        });

        it('should authenticate with valid API key against hash', async () => {
            mockRequest.headers['x-api-key'] = testApiKey.key;
            mockGetValidHashes.mockResolvedValue([testApiKey.hash]);

            const middleware = authenticateApiKeyWithHashes(mockGetValidHashes);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockGetValidHashes).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(mockRequest.apiKey).toBe(testApiKey.key);
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should authenticate with valid API key from authorization header', async () => {
            mockRequest.headers['authorization'] = `Bearer ${testApiKey.key}`;
            mockGetValidHashes.mockResolvedValue([testApiKey.hash]);

            const middleware = authenticateApiKeyWithHashes(mockGetValidHashes);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRequest.apiKey).toBe(testApiKey.key);
        });

        it('should return 401 when no API key is provided', async () => {
            mockGetValidHashes.mockResolvedValue([testApiKey.hash]);

            const middleware = authenticateApiKeyWithHashes(mockGetValidHashes);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'API key required',
                message: 'Provide a valid API key in the x-api-key or authorization header',
            });
        });

        it('should return 403 when API key does not match any hash', async () => {
            mockRequest.headers['x-api-key'] = 'invalid_key';
            mockGetValidHashes.mockResolvedValue([testApiKey.hash]);

            const middleware = authenticateApiKeyWithHashes(mockGetValidHashes);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Invalid API key',
                message: 'The provided API key is not valid',
            });
        });

        it('should handle multiple valid hashes', async () => {
            const testApiKey2 = await generateApiKey();
            mockRequest.headers['x-api-key'] = testApiKey2.key;
            mockGetValidHashes.mockResolvedValue([testApiKey.hash, testApiKey2.hash]);

            const middleware = authenticateApiKeyWithHashes(mockGetValidHashes);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRequest.apiKey).toBe(testApiKey2.key);
        });

        it('should handle empty hashes array', async () => {
            mockRequest.headers['x-api-key'] = testApiKey.key;
            mockGetValidHashes.mockResolvedValue([]);

            const middleware = authenticateApiKeyWithHashes(mockGetValidHashes);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
        });

        it('should return 500 when getValidHashes throws an error', async () => {
            mockRequest.headers['x-api-key'] = testApiKey.key;
            mockGetValidHashes.mockRejectedValue(new Error('Database error'));

            const middleware = authenticateApiKeyWithHashes(mockGetValidHashes);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Internal server error',
                message: 'Error verifying the API key',
            });
        });

        it('should log errors to console', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            mockRequest.headers['x-api-key'] = testApiKey.key;
            const testError = new Error('Database error');
            mockGetValidHashes.mockRejectedValue(testError);

            const middleware = authenticateApiKeyWithHashes(mockGetValidHashes);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(consoleSpy).toHaveBeenCalledWith('Error in API key authentication:', testError);

            consoleSpy.mockRestore();
        });

        it('should handle promise rejection in getValidHashes', async () => {
            mockRequest.headers['x-api-key'] = testApiKey.key;
            mockGetValidHashes.mockRejectedValue('String error');

            const middleware = authenticateApiKeyWithHashes(mockGetValidHashes);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });
});
