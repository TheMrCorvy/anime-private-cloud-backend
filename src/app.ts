import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class App {
    public app: Application;
    private readonly port: string | number;

    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;

        this.initializeMiddlewares();
        this.initializeRoutes();
    }

    private initializeMiddlewares(): void {
        // Security middleware
        this.app.use(helmet());

        // CORS middleware
        this.app.use(
            cors({
                origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
                credentials: true,
            })
        );

        // Logging middleware
        this.app.use(morgan('combined'));

        // Body parsing middleware
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
    }

    private initializeRoutes(): void {
        // Health check route
        this.app.get('/health', (req: Request, res: Response) => {
            res.status(200).json({
                status: 'OK',
                message: 'Anime Private Cloud Backend is running',
                timestamp: new Date().toISOString(),
            });
        });

        // API routes placeholder
        this.app.get('/api/v1', (req: Request, res: Response) => {
            res.status(200).json({
                message: 'Welcome to Anime Private Cloud API v1',
                version: '1.0.0',
            });
        });

        // 404 handler
        this.app.use('*', (req: Request, res: Response) => {
            res.status(404).json({
                error: 'Route not found',
                path: req.originalUrl,
            });
        });
    }

    public listen(): void {
        this.app.listen(this.port, () => {
            console.log(
                `🚀 Anime Private Cloud Backend is running on port ${this.port}`
            );
            console.log(
                `📊 Health check available at http://localhost:${this.port}/health`
            );
        });
    }
}

export default App;
