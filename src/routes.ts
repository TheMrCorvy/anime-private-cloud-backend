import { Router, Request, Response } from 'express';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'OK',
        message: 'Anime Private Cloud Backend is running',
        timestamp: new Date().toISOString(),
    });
});

router.get('/api/v1', (_req: Request, res: Response) => {
    res.status(200).json({
        message: 'Welcome to Anime Private Cloud API v1',
        version: '1.0.0',
    });
});

// 404 handler
router.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
    });
});

export default router;
