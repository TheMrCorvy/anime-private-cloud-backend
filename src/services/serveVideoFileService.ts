import { isFeatureFlagEnabled, FeatureNames } from './featureFlagService';

import { createReadStream, statSync } from 'fs';
import { join } from 'path';

interface NASServiceParams {
    videoSrc: string;
    range: string | null;
}

interface VideoStreamResponse {
    stream?: NodeJS.ReadableStream;
    headers?: Record<string, string>;
    status: number;
    message: string;
    error?: string;
}

export const serveVideoFileService = ({ videoSrc, range }: NASServiceParams): VideoStreamResponse => {
    let fileSrc = '';
    if (isFeatureFlagEnabled(FeatureNames.SERVE_MOCK_DATA)) {
        fileSrc = join(process.cwd(), 'mock/deathNote.mp4');
    } else {
        fileSrc = videoSrc;
    }

    try {
        const fileMetadata = statSync(fileSrc);

        if (!range) {
            const headers = {
                'Content-Type': 'video/mp4',
                'Content-Length': fileMetadata.size.toString(),
                'Accept-Ranges': 'bytes',
            };
            const stream = createReadStream(fileSrc);

            return { stream, headers, status: 200, message: 'Streaming video...' };
        }

        const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : fileMetadata.size - 1;

        if (start >= fileMetadata.size || end >= fileMetadata.size) {
            return { status: 416, message: 'Requested range not satisfiable' };
        }

        const chunkSize = end - start + 1;
        const stream = createReadStream(fileSrc, { start, end });

        const headers = {
            'Content-Range': `bytes ${start}-${end}/${fileMetadata.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize.toString(),
            'Content-Type': 'video/mp4',
        };

        return { stream, headers, status: 206, message: 'Streaming video chunk...' };
    } catch (error) {
        console.error('Error streaming video:', error);

        return {
            status: 500,
            message: 'Internal Server Error',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};
