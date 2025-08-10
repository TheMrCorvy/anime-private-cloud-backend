import express from 'express';
import type { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes';
import { authenticateApiKey } from './middleware/apiKeyAuth';

dotenv.config();

const validApiKeys: string[] = JSON.parse(process.env.API_KEYS as string);

export function createApp(): Express {
    const app = express();

    // Middlewares
    app.use(helmet());
    app.use(
        cors({
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
            credentials: true,
        })
    );
    app.use(morgan('combined'));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use(authenticateApiKey(validApiKeys));

    app.use(routes);

    return app;
}
