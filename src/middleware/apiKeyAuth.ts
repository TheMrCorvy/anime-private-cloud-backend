import { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyApiKey } from '../services/apiKeyService';

// Extends the Express Request interface using module declaration
declare module 'express-serve-static-core' {
    interface Request {
        apiKey?: string;
    }
}

/**
 * Middleware to authenticate API keys
 * Looks for the API key in the 'x-api-key' or 'authorization' header or in a query in the URL...
 * (Yes I know...) The problem here is that the <video> html tag cannot send an API key in the headers or the body :sob:
 */
export const authenticateApiKey = (validApiKeys: string[]): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        const apiKey =
            (req.headers['x-api-key'] as string) ||
            (req.headers['authorization']?.replace('Bearer ', '') as string) ||
            (req.query.apiKey as string);

        if (!apiKey) {
            return res.status(401).json({
                error: 'API key required',
                message: 'Provide a valid API key in the x-api-key or authorization header',
            });
        }

        const isValid = validApiKeys.some(validKey => apiKey === validKey);

        if (!isValid) {
            console.log(`Invalid API key attempt: ${apiKey}`);
            console.log(`Valid API keys: ${validApiKeys.join(', ')}`);

            return res.status(403).json({
                error: 'Invalid API key',
                message: 'The provided API key is not valid',
            });
        }

        req.apiKey = apiKey;
        next();
    };
};

/**
 * Advanced middleware that checks against stored hashes
 * Useful when you store hashes in a database
 */
export const authenticateApiKeyWithHashes = (getValidHashes: () => Promise<string[]>): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const apiKey =
                (req.headers['x-api-key'] as string) ||
                (req.headers['authorization']?.replace('Bearer ', '') as string) ||
                (req.query.apiKey as string);

            if (!apiKey) {
                return res.status(401).json({
                    error: 'API key required',
                    message: 'Provide a valid API key in the x-api-key or authorization header',
                });
            }

            // Get valid hashes (e.g., from database)
            const validHashes = await getValidHashes();

            // Check the API key against all valid hashes
            const results = await Promise.all(validHashes.map(hash => verifyApiKey(apiKey, hash)));
            const isValid = results.some(Boolean);

            if (!isValid) {
                return res.status(403).json({
                    error: 'Invalid API key',
                    message: 'The provided API key is not valid',
                });
            }

            req.apiKey = apiKey;
            next();
        } catch (error) {
            console.error('Error in API key authentication:', error);
            return res.status(500).json({
                error: 'Internal server error',
                message: 'Error verifying the API key',
            });
        }
    };
};
