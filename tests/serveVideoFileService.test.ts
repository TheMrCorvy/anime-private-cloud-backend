import fs from 'fs';
import path from 'path';
import { serveVideoFileService } from '../src/services/serveVideoFileService';
import { isFeatureFlagEnabled, FeatureNames } from '../src/services/featureFlagService';

// Mock dependencies
jest.mock('fs');
jest.mock('../src/services/featureFlagService');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockIsFeatureFlagEnabled = isFeatureFlagEnabled as jest.MockedFunction<typeof isFeatureFlagEnabled>;

describe('serveVideoFileService', () => {
    const mockVideoSrc = '/path/to/video.mp4';
    const mockFileSize = 1000000; // 1MB
    const mockStream = { pipe: jest.fn() } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Default mocks
        mockIsFeatureFlagEnabled.mockReturnValue(false);
        mockFs.statSync.mockReturnValue({ size: mockFileSize } as any);
        mockFs.createReadStream.mockReturnValue(mockStream);
        
        // Mock console.error to avoid output during tests
        jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('without range header', () => {
        it('should serve full video file', () => {
            const result = serveVideoFileService({
                videoSrc: mockVideoSrc,
                range: null,
            });

            expect(result).toEqual({
                stream: mockStream,
                headers: {
                    'Content-Type': 'video/mp4',
                    'Content-Length': mockFileSize.toString(),
                    'Accept-Ranges': 'bytes',
                },
                status: 200,
                message: 'Streaming video...',
            });

            expect(mockFs.createReadStream).toHaveBeenCalledWith(mockVideoSrc);
            expect(mockFs.statSync).toHaveBeenCalledWith(mockVideoSrc);
        });

        it('should use mock file when feature flag is enabled', () => {
            mockIsFeatureFlagEnabled.mockReturnValue(true);
            const expectedMockPath = path.join(process.cwd(), 'mock/deathNote.mp4');

            const result = serveVideoFileService({
                videoSrc: mockVideoSrc,
                range: null,
            });

            expect(mockIsFeatureFlagEnabled).toHaveBeenCalledWith(FeatureNames.SERVE_MOCK_DATA);
            expect(mockFs.statSync).toHaveBeenCalledWith(expectedMockPath);
            expect(mockFs.createReadStream).toHaveBeenCalledWith(expectedMockPath);
            expect(result.status).toBe(200);
        });
    });

    describe('with range header', () => {
        it('should serve partial content with valid range', () => {
            const range = 'bytes=0-499';
            
            const result = serveVideoFileService({
                videoSrc: mockVideoSrc,
                range,
            });

            expect(result).toEqual({
                stream: mockStream,
                headers: {
                    'Content-Range': `bytes 0-499/${mockFileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': '500',
                    'Content-Type': 'video/mp4',
                },
                status: 206,
                message: 'Streaming video chunk...',
            });

            expect(mockFs.createReadStream).toHaveBeenCalledWith(mockVideoSrc, {
                start: 0,
                end: 499,
            });
        });

        it('should handle range without end value', () => {
            const range = 'bytes=500-';
            
            const result = serveVideoFileService({
                videoSrc: mockVideoSrc,
                range,
            });

            const expectedEnd = mockFileSize - 1;
            const expectedChunkSize = expectedEnd - 500 + 1;

            expect(result).toEqual({
                stream: mockStream,
                headers: {
                    'Content-Range': `bytes 500-${expectedEnd}/${mockFileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': expectedChunkSize.toString(),
                    'Content-Type': 'video/mp4',
                },
                status: 206,
                message: 'Streaming video chunk...',
            });

            expect(mockFs.createReadStream).toHaveBeenCalledWith(mockVideoSrc, {
                start: 500,
                end: expectedEnd,
            });
        });

        it('should handle middle range request', () => {
            const range = 'bytes=1000-1999';
            
            const result = serveVideoFileService({
                videoSrc: mockVideoSrc,
                range,
            });

            expect(result.headers).toEqual({
                'Content-Range': `bytes 1000-1999/${mockFileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': '1000',
                'Content-Type': 'video/mp4',
            });

            expect(result.status).toBe(206);
        });

        it('should return 416 when start position exceeds file size', () => {
            const range = `bytes=${mockFileSize + 1000}-`;
            
            const result = serveVideoFileService({
                videoSrc: mockVideoSrc,
                range,
            });

            expect(result).toEqual({
                status: 416,
                message: 'Requested range not satisfiable',
            });

            expect(mockFs.createReadStream).not.toHaveBeenCalled();
        });

        it('should return 416 when end position exceeds file size', () => {
            const range = `bytes=0-${mockFileSize + 1000}`;
            
            const result = serveVideoFileService({
                videoSrc: mockVideoSrc,
                range,
            });

            expect(result).toEqual({
                status: 416,
                message: 'Requested range not satisfiable',
            });
        });

        it('should handle edge case of range at file boundary', () => {
            const range = `bytes=${mockFileSize - 100}-${mockFileSize - 1}`;
            
            const result = serveVideoFileService({
                videoSrc: mockVideoSrc,
                range,
            });

            expect(result.status).toBe(206);
            expect(result.headers?.['Content-Length']).toBe('100');
        });

        it('should handle single byte range', () => {
            const range = 'bytes=0-0';
            
            const result = serveVideoFileService({
                videoSrc: mockVideoSrc,
                range,
            });

            expect(result.status).toBe(206);
            expect(result.headers?.['Content-Length']).toBe('1');
            expect(result.headers?.['Content-Range']).toBe(`bytes 0-0/${mockFileSize}`);
        });
    });

    describe('error handling', () => {
        it('should return 500 when file does not exist', () => {
            const error = new Error('ENOENT: no such file or directory');
            mockFs.statSync.mockImplementation(() => {
                throw error;
            });

            const result = serveVideoFileService({
                videoSrc: mockVideoSrc,
                range: null,
            });

            expect(result).toEqual({
                status: 500,
                message: 'Internal Server Error',
                error: 'ENOENT: no such file or directory',
            });

            expect(console.error).toHaveBeenCalledWith('Error streaming video:', error);
        });

        it('should handle non-Error exceptions', () => {
            const error = 'String error';
            mockFs.statSync.mockImplementation(() => {
                throw error;
            });

            const result = serveVideoFileService({
                videoSrc: mockVideoSrc,
                range: null,
            });

            expect(result).toEqual({
                status: 500,
                message: 'Internal Server Error',
                error: 'Unknown error',
            });
        });

        it('should handle error in createReadStream', () => {
            const error = new Error('Permission denied');
            mockFs.createReadStream.mockImplementation(() => {
                throw error;
            });

            const result = serveVideoFileService({
                videoSrc: mockVideoSrc,
                range: null,
            });

            expect(result.status).toBe(500);
            expect(result.error).toBe('Permission denied');
        });
    });

    describe('range parsing edge cases', () => {
        it('should handle range with extra whitespace', () => {
            const range = ' bytes=100-200 ';
            
            const result = serveVideoFileService({
                videoSrc: mockVideoSrc,
                range,
            });

            expect(result.status).toBe(206);
            expect(result.headers?.['Content-Range']).toBe(`bytes 100-200/${mockFileSize}`);
        });

        it('should handle range with end equal to start', () => {
            const range = 'bytes=500-500';
            
            const result = serveVideoFileService({
                videoSrc: mockVideoSrc,
                range,
            });

            expect(result.status).toBe(206);
            expect(result.headers?.['Content-Length']).toBe('1');
        });

        it('should handle large file sizes', () => {
            const largeFileSize = 5000000000; // 5GB
            mockFs.statSync.mockReturnValue({ size: largeFileSize } as any);

            const range = 'bytes=0-1023';
            
            const result = serveVideoFileService({
                videoSrc: mockVideoSrc,
                range,
            });

            expect(result.status).toBe(206);
            expect(result.headers?.['Content-Range']).toBe(`bytes 0-1023/${largeFileSize}`);
            expect(result.headers?.['Content-Length']).toBe('1024');
        });
    });

    describe('feature flag integration', () => {
        it('should check feature flag for every request', () => {
            mockIsFeatureFlagEnabled.mockReturnValue(false);

            serveVideoFileService({
                videoSrc: mockVideoSrc,
                range: null,
            });

            expect(mockIsFeatureFlagEnabled).toHaveBeenCalledWith(FeatureNames.SERVE_MOCK_DATA);
            expect(mockIsFeatureFlagEnabled).toHaveBeenCalledTimes(1);
        });

        it('should handle mock file error when feature flag enabled', () => {
            mockIsFeatureFlagEnabled.mockReturnValue(true);
            const mockError = new Error('Mock file not found');
            mockFs.statSync.mockImplementation(() => {
                throw mockError;
            });

            const result = serveVideoFileService({
                videoSrc: mockVideoSrc,
                range: null,
            });

            expect(result.status).toBe(500);
            expect(result.error).toBe('Mock file not found');
        });
    });
});
