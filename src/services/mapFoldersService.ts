import fs from 'fs';
import path from 'path';

interface FolderContent {
    folderName: string;
    folderPath: string;
    mp4Files: string[];
}

export function getFoldersWithMp4Files(dirPath: string): FolderContent[] {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    const results: FolderContent[] = [];

    for (const item of items) {
        if (item.isDirectory()) {
            const fullFolderPath = path.join(dirPath, item.name);
            const subItems = fs.readdirSync(fullFolderPath);
            const mp4Files = subItems.filter(file => file.endsWith('.mkv') && !file.startsWith('._'));

            results.push({
                folderName: item.name,
                folderPath: fullFolderPath,
                mp4Files,
            });
        }
    }

    return results;
}

// Example usage
