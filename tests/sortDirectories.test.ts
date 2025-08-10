import sortDirectories from '../src/utils/sortDirectories';
import { Directory } from '../src/utils/typesDefinition';

describe('sortDirectories', () => {
    const createDirectory = (name: string, directoryPath: string, parentDirectory: string | null = null): Directory => ({
        display_name: name,
        directory_path: directoryPath,
        adult: false,
        parent_directory: parentDirectory,
        sub_directories: [],
        anime_episodes: [],
    });

    it('should sort directories by parent directory depth (ascending)', () => {
        const directories: Directory[] = [
            createDirectory('Deep Nested', '/root/level1/level2/level3', '/root/level1/level2'),
            createDirectory('Root Level', '/root', null),
            createDirectory('Mid Level', '/root/level1/mid', '/root/level1'),
            createDirectory('First Level', '/root/level1', '/root'),
        ];

        const sorted = sortDirectories(directories);

        expect(sorted.map(d => d.display_name)).toEqual([
            'Root Level',        // 0 levels (null parent)
            'First Level',       // 1 level  (/root)
            'Mid Level',         // 2 levels (/root/level1)
            'Deep Nested',       // 3 levels (/root/level1/level2)
        ]);
    });

    it('should handle Windows-style paths by normalizing them', () => {
        const directories: Directory[] = [
            createDirectory('Windows Deep', 'C:\\root\\level1\\level2', 'C:\\root\\level1'),
            createDirectory('Windows Root', 'C:\\root', null),
            createDirectory('Mixed Path', '/unix/path', '/unix'),
        ];

        const sorted = sortDirectories(directories);

        expect(sorted.map(d => d.display_name)).toEqual([
            'Windows Root',      // 0 levels (null parent)
            'Mixed Path',        // 1 level  (/unix)
            'Windows Deep',      // 2 levels (C:/root/level1 after normalization)
        ]);
    });

    it('should sort alphabetically by parent_directory when directories have same depth', () => {
        const directories: Directory[] = [
            createDirectory('Z Anime', '/root/z-anime', '/root/z'),
            createDirectory('A Anime', '/root/a-anime', '/root/a'),
            createDirectory('M Anime', '/root/m-anime', '/root/m'),
            createDirectory('B Anime', '/root/b-anime', '/root/b'),
        ];

        const sorted = sortDirectories(directories);

        // Should be sorted by parent_directory alphabetically when depth is same
        expect(sorted.map(d => d.display_name)).toEqual([
            'A Anime',  // /root/a
            'B Anime',  // /root/b
            'M Anime',  // /root/m
            'Z Anime',  // /root/z
        ]);
    });

    it('should handle empty array', () => {
        const directories: Directory[] = [];
        const sorted = sortDirectories(directories);
        expect(sorted).toEqual([]);
    });

    it('should handle single directory', () => {
        const directories: Directory[] = [
            createDirectory('Single', '/root/single', '/root'),
        ];

        const sorted = sortDirectories(directories);
        expect(sorted).toHaveLength(1);
        expect(sorted[0].display_name).toBe('Single');
    });

    it('should handle null parent directories', () => {
        const directories: Directory[] = [
            createDirectory('Child', '/root/child', '/root'),
            createDirectory('Root1', '/root1', null),
            createDirectory('Root2', '/root2', null),
        ];

        const sorted = sortDirectories(directories);

        // Roots should come first, then sorted alphabetically
        expect(sorted.slice(0, 2).every(d => d.parent_directory === null || d.parent_directory === '')).toBe(true);
        expect(sorted[2].display_name).toBe('Child');
    });

    it('should handle complex nested hierarchy', () => {
        const directories: Directory[] = [
            // Level 3
            createDirectory('Anime A S1', '/anime/a/season1', '/anime/a'),
            createDirectory('Anime A S2', '/anime/a/season2', '/anime/a'),
            
            // Level 2  
            createDirectory('Anime A', '/anime/a', '/anime'),
            createDirectory('Anime B', '/anime/b', '/anime'),
            
            // Level 4
            createDirectory('Episode Folder', '/anime/a/season1/episodes', '/anime/a/season1'),
            
            // Level 1
            createDirectory('Root Anime', '/anime', null),
            createDirectory('Root Movies', '/movies', null),
        ];

        const sorted = sortDirectories(directories);

        const depths = sorted.map(dir => {
            if (!dir.parent_directory) return 0;
            return dir.parent_directory.split('/').filter(Boolean).length;
        });

        // Check that depths are in ascending order
        for (let i = 1; i < depths.length; i++) {
            expect(depths[i]).toBeGreaterThanOrEqual(depths[i - 1]);
        }
    });

    it('should preserve original directory properties', () => {
        const originalDirectory: Directory = {
            display_name: 'Test Anime',
            directory_path: '/test/anime',
            adult: true,
            parent_directory: '/test',
            sub_directories: ['/test/anime/season1'],
            anime_episodes: [
                {
                    display_name: 'Episode 1',
                    file_path: '/test/anime/episode1.mp4',
                    parent_directory: '/test/anime',
                },
            ],
        };

        const sorted = sortDirectories([originalDirectory]);

        expect(sorted[0]).toEqual(originalDirectory);
        expect(sorted[0].adult).toBe(true);
        expect(sorted[0].sub_directories).toEqual(['/test/anime/season1']);
        expect(sorted[0].anime_episodes).toHaveLength(1);
    });

    it('should handle directories with empty string parent directories', () => {
        const directories: Directory[] = [
            createDirectory('Empty Parent', '/root/child', ''),
            createDirectory('Null Parent', '/root/null', null),
            createDirectory('Real Parent', '/root/real/child', '/root/real'),
        ];

        const sorted = sortDirectories(directories);

        // Both empty string and null should be treated as root level
        expect(sorted.slice(0, 2).every(d => !d.parent_directory || d.parent_directory === '')).toBe(true);
        expect(sorted[2].display_name).toBe('Real Parent');
    });

    it('should handle special characters in paths', () => {
        const directories: Directory[] = [
            createDirectory('Special Chars', '/root/spëc!@l/ch@rs', '/root/spëc!@l'),
            createDirectory('Normal', '/root/normal', '/root'),
        ];

        const sorted = sortDirectories(directories);

        expect(sorted).toHaveLength(2);
        expect(sorted[0].display_name).toBe('Normal');
        expect(sorted[1].display_name).toBe('Special Chars');
    });
});
