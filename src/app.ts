import express from 'express';
import type { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes';

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
    app.use(routes);

    // 404 handler
    app.use((req, res) => {
        res.status(404).json({
            error: 'Route not found',
            path: req.originalUrl,
        });
    });

    return app;
}
