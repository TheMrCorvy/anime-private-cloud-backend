import { Router, Request, Response } from 'express';
import { serveVideoFileService } from './services/serveVideoFileService';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'OK',
        message: 'Anime Private Cloud Backend is running.',
        timestamp: new Date().toISOString(),
    });
});

router.post('/api/serve-anime-episode', async (req: Request, res: Response) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            error: 'Body is empty or undefined',
            message: 'Make sure to send a JSON body with Content-Type: application/json',
            received: {
                body: req.body,
                contentType: req.headers['content-type'],
            },
        });
    }

    const filePath = req.body.filePath;
    const range = req.headers.range || null;

    if (!filePath) {
        return res.status(400).json({ message: 'Missing videoSrc in request body.' });
    }

    const { stream, headers, status, message, error } = serveVideoFileService({ videoSrc: filePath, range });

    if (error) {
        return res.status(status).json({ message, error });
    }

    if (!stream || !headers) {
        return res.status(500).json({ message: 'Stream or headers missing unexpectedly.' });
    }

    res.writeHead(status, headers);
    stream.pipe(res);
});

// 404 handler
router.use((req: Request, res: Response) => {
    console.log(`404 Not Found: ${req.originalUrl}`);
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
    });
});

export default router;
