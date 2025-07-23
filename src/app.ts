import express, { Request, Response } from 'express';
import type { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

    // Rutas
    app.get('/health', (_req: Request, res: Response) => {
        res.status(200).json({
            status: 'OK',
            message: 'Anime Private Cloud Backend is running',
            timestamp: new Date().toISOString(),
        });
    });

    app.get('/api/v1', (_req: Request, res: Response) => {
        res.status(200).json({
            message: 'Welcome to Anime Private Cloud API v1',
            version: '1.0.0',
        });
    });

    // 404 handler
    app.use((req: Request, res: Response) => {
        res.status(404).json({
            error: 'Route not found',
            path: req.originalUrl,
        });
    });

    return app;
}
