import fs from 'fs';
import path from 'path';
import { scanSingleFolder, writeJsonFile } from '../src/services/diskService';
import { Directory } from '../src/utils/typesDefinition';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('diskService', () => {
    describe('scanSingleFolder', () => {
        const mockDirPath = '/test/anime/folder';
        const mockExcludedParents = ['Temp', 'Downloads'];
        const mockExcludedFileExtensions = ['.txt', '.nfo'];

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should scan a folder with anime episodes and subdirectories', () => {
            const mockDirents = [
                { name: 'Episode 1.mp4', isFile: () => true, isDirectory: () => false },
                { name: 'Episode 2.mp4', isFile: () => true, isDirectory: () => false },
                { name: 'Season 2', isFile: () => false, isDirectory: () => true },
                { name: '.DS_Store', isFile: () => true, isDirectory: () => false },
                { name: 'info.txt', isFile: () => true, isDirectory: () => false },
            ];

            mockFs.readdirSync.mockReturnValue(mockDirents as any);

            const result = scanSingleFolder({
                dirPath: mockDirPath,
                excludedParents: mockExcludedParents,
                excludedFileExtensions: mockExcludedFileExtensions,
            });

            expect(result).toEqual({
                display_name: 'folder',
                directory_path: mockDirPath,
                adult: false,
                parent_directory: '/test/anime',
                sub_directories: ['/test/anime/folder/Season 2'],
                anime_episodes: [
                    {
                        display_name: 'Episode 1',
                        file_path: '/test/anime/folder/Episode 1.mp4',
                        parent_directory: mockDirPath,
                    },
                    {
                        display_name: 'Episode 2',
                        file_path: '/test/anime/folder/Episode 2.mp4',
                        parent_directory: mockDirPath,
                    },
                ],
            });

            expect(mockFs.readdirSync).toHaveBeenCalledWith(mockDirPath, { withFileTypes: true });
        });

        it('should detect and handle adult content folders', () => {
            const adultDirPath = '/test/anime/* Adult Content';
            const mockDirents = [
                { name: 'Episode 1.mp4', isFile: () => true, isDirectory: () => false },
            ];

            mockFs.readdirSync.mockReturnValue(mockDirents as any);

            const result = scanSingleFolder({
                dirPath: adultDirPath,
                excludedParents: mockExcludedParents,
                excludedFileExtensions: mockExcludedFileExtensions,
            });

            expect(result.display_name).toBe('Adult Content');
            expect(result.adult).toBe(true);
        });

        it('should exclude files based on excluded extensions', () => {
            const mockDirents = [
                { name: 'Episode 1.mp4', isFile: () => true, isDirectory: () => false },
                { name: 'info.txt', isFile: () => true, isDirectory: () => false },
                { name: 'metadata.nfo', isFile: () => true, isDirectory: () => false },
            ];

            mockFs.readdirSync.mockReturnValue(mockDirents as any);

            const result = scanSingleFolder({
                dirPath: mockDirPath,
                excludedParents: mockExcludedParents,
                excludedFileExtensions: mockExcludedFileExtensions,
            });

            expect(result.anime_episodes).toHaveLength(1);
            expect(result.anime_episodes[0].display_name).toBe('Episode 1');
        });

        it('should exclude system files and hidden files', () => {
            const mockDirents = [
                { name: 'Episode 1.mp4', isFile: () => true, isDirectory: () => false },
                { name: '.DS_Store', isFile: () => true, isDirectory: () => false },
                { name: '._hidden', isFile: () => true, isDirectory: () => false },
                { name: 'Thumbs.db', isFile: () => true, isDirectory: () => false },
                { name: 'desktop.ini', isFile: () => true, isDirectory: () => false },
            ];

            mockFs.readdirSync.mockReturnValue(mockDirents as any);

            const result = scanSingleFolder({
                dirPath: mockDirPath,
                excludedParents: mockExcludedParents,
                excludedFileExtensions: mockExcludedFileExtensions,
            });

            expect(result.anime_episodes).toHaveLength(1);
            expect(result.anime_episodes[0].display_name).toBe('Episode 1');
        });

        it('should return null parent directory for excluded parents', () => {
            const pathWithExcludedParent = '/test/Temp/anime';
            const mockDirents = [
                { name: 'Episode 1.mp4', isFile: () => true, isDirectory: () => false },
            ];

            mockFs.readdirSync.mockReturnValue(mockDirents as any);

            const result = scanSingleFolder({
                dirPath: pathWithExcludedParent,
                excludedParents: mockExcludedParents,
                excludedFileExtensions: mockExcludedFileExtensions,
            });

            expect(result.parent_directory).toBeNull();
        });

        it('should handle empty directories', () => {
            mockFs.readdirSync.mockReturnValue([]);

            const result = scanSingleFolder({
                dirPath: mockDirPath,
                excludedParents: mockExcludedParents,
                excludedFileExtensions: mockExcludedFileExtensions,
            });

            expect(result.sub_directories).toHaveLength(0);
            expect(result.anime_episodes).toHaveLength(0);
            expect(result.display_name).toBe('folder');
        });

        it('should handle directories with only subdirectories', () => {
            const mockDirents = [
                { name: 'Season 1', isFile: () => false, isDirectory: () => true },
                { name: 'Season 2', isFile: () => false, isDirectory: () => true },
                { name: 'Extras', isFile: () => false, isDirectory: () => true },
            ];

            mockFs.readdirSync.mockReturnValue(mockDirents as any);

            const result = scanSingleFolder({
                dirPath: mockDirPath,
                excludedParents: mockExcludedParents,
                excludedFileExtensions: mockExcludedFileExtensions,
            });

            expect(result.anime_episodes).toHaveLength(0);
            expect(result.sub_directories).toHaveLength(3);
            expect(result.sub_directories).toEqual([
                '/test/anime/folder/Season 1',
                '/test/anime/folder/Season 2',
                '/test/anime/folder/Extras',
            ]);
        });

        it('should properly strip .mp4 extension from episode names', () => {
            const mockDirents = [
                { name: 'My Favorite Anime - Episode 1.mp4', isFile: () => true, isDirectory: () => false },
                { name: 'My Favorite Anime - Episode 2.MP4', isFile: () => true, isDirectory: () => false },
            ];

            mockFs.readdirSync.mockReturnValue(mockDirents as any);

            const result = scanSingleFolder({
                dirPath: mockDirPath,
                excludedParents: mockExcludedParents,
                excludedFileExtensions: mockExcludedFileExtensions,
            });

            expect(result.anime_episodes[0].display_name).toBe('My Favorite Anime - Episode 1');
            // Note: The current implementation only removes .mp4, not .MP4
            expect(result.anime_episodes[1].display_name).toBe('My Favorite Anime - Episode 2.MP4');
        });
    });

    describe('writeJsonFile', () => {
        const mockOutputPath = '/test/output';
        const mockFileName = 'test-data';

        beforeEach(() => {
            jest.clearAllMocks();
            // Mock console.log to avoid output during tests
            jest.spyOn(console, 'log').mockImplementation();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should write JSON file with data and create directories if needed', () => {
            const testData: Directory[] = [
                {
                    display_name: 'Test Anime',
                    directory_path: '/test/anime',
                    adult: false,
                    parent_directory: null,
                    sub_directories: [],
                    anime_episodes: [],
                },
            ];

            mockFs.existsSync.mockReturnValue(false);
            mockFs.mkdirSync.mockImplementation(() => '');
            mockFs.writeFileSync.mockImplementation(() => {});

            writeJsonFile({
                outputFolderPath: mockOutputPath,
                data: testData,
                fileName: mockFileName,
            });

            expect(mockFs.existsSync).toHaveBeenCalledWith(mockOutputPath);
            expect(mockFs.mkdirSync).toHaveBeenCalledWith(mockOutputPath, { recursive: true });
            expect(mockFs.writeFileSync).toHaveBeenCalledWith(
                path.join(path.resolve(mockOutputPath), `${mockFileName}.json`),
                JSON.stringify({
                    amount_of_items: testData.length,
                    data: testData,
                }),
                'utf-8'
            );
        });

        it('should not create directory if it already exists', () => {
            const testData: Directory[] = [];

            mockFs.existsSync.mockReturnValue(true);
            mockFs.writeFileSync.mockImplementation(() => {});

            writeJsonFile({
                outputFolderPath: mockOutputPath,
                data: testData,
                fileName: mockFileName,
            });

            expect(mockFs.mkdirSync).not.toHaveBeenCalled();
        });

        it('should handle empty data array', () => {
            const testData: Directory[] = [];

            mockFs.existsSync.mockReturnValue(true);
            mockFs.writeFileSync.mockImplementation(() => {});

            writeJsonFile({
                outputFolderPath: mockOutputPath,
                data: testData,
                fileName: mockFileName,
            });

            expect(mockFs.writeFileSync).toHaveBeenCalledWith(
                expect.any(String),
                JSON.stringify({
                    amount_of_items: 0,
                    data: [],
                }),
                'utf-8'
            );
        });

        it('should handle large data arrays', () => {
            const testData: Directory[] = Array.from({ length: 1000 }, (_, i) => ({
                display_name: `Test Anime ${i}`,
                directory_path: `/test/anime/${i}`,
                adult: false,
                parent_directory: null,
                sub_directories: [],
                anime_episodes: [],
            }));

            mockFs.existsSync.mockReturnValue(true);
            mockFs.writeFileSync.mockImplementation(() => {});

            writeJsonFile({
                outputFolderPath: mockOutputPath,
                data: testData,
                fileName: mockFileName,
            });

            expect(mockFs.writeFileSync).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('"amount_of_items":1000'),
                'utf-8'
            );
        });

        it('should create nested directories recursively', () => {
            const nestedPath = '/test/nested/output/path';
            const testData: Directory[] = [];

            mockFs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(false);
            mockFs.mkdirSync.mockImplementation(() => '');
            mockFs.writeFileSync.mockImplementation(() => {});

            writeJsonFile({
                outputFolderPath: nestedPath,
                data: testData,
                fileName: mockFileName,
            });

            expect(mockFs.mkdirSync).toHaveBeenCalledWith(nestedPath, { recursive: true });
            expect(mockFs.mkdirSync).toHaveBeenCalledWith(path.resolve(nestedPath), { recursive: true });
        });
    });
});
