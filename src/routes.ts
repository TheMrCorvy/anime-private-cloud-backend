import { Router, Request, Response } from 'express';
import { serveVideoFileService } from './services/serveVideoFileService';
import path from 'path';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'OK',
        message: 'Anime Private Cloud Backend is running.',
        timestamp: new Date().toISOString(),
    });
});

router.get('/api/serve-anime-episode', (req: Request, res: Response) => {
    const { filePath } = req.query as { filePath?: string; apiKey?: string };
    const range = req.headers.range || null;

    if (!filePath) {
        return res.status(400).json({ message: 'Missing file path in query parameters.' });
    }

    const resolvedPath = path.resolve(decodeURIComponent(filePath));
    const { stream, headers, status, message, error } = serveVideoFileService({ videoSrc: resolvedPath, range });

    if (error) {
        return res.status(status).json({ message, error });
    }

    if (!stream || !headers) {
        return res.status(500).json({ message: 'Stream or headers missing unexpectedly.' });
    }

    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
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
