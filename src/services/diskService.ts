import fs from 'fs';
import path from 'path';
import { Directory } from '../utils/typesDefinition';

export const scanSingleFolder = (dirPath: string, excludedParents: string[]): Directory => {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    const folderIsAdult = determineIfFolderIsAdult(path.basename(dirPath));
    const displayName = !folderIsAdult ? path.basename(dirPath) : removeAsteriskFromFolderName(path.basename(dirPath));

    const result: Directory = {
        display_name: displayName,
        directory_path: dirPath,
        adult: folderIsAdult,
        parent_directory: checkIfParentDirectoryExists(dirPath, excludedParents),
        sub_directories: [],
        anime_episodes: [],
    };

    for (const item of items) {
        if (item.isDirectory()) {
            result.sub_directories.push(path.join(dirPath, item.name));
        } else if (item.isFile() && !animeEpisodeShouldBeIgnored(item.name)) {
            result.anime_episodes.push({
                display_name: item.name,
                file_path: path.join(dirPath, item.name),
                parent_directory: dirPath,
            });
        }
    }

    return result;
};

const removeAsteriskFromFolderName = (folderName: string): string => {
    return folderName.startsWith('* ') ? folderName.slice(2) : folderName;
};

const animeEpisodeShouldBeIgnored = (fileName: string): boolean => {
    const ignoredExtensions = ['.mkv'];
    const ignoredPrefixes = ['.', '._', 'Thumbs.db', 'desktop.ini'];
    return (
        ignoredExtensions.some(ext => fileName.endsWith(ext)) ||
        ignoredPrefixes.some(prefix => fileName.startsWith(prefix))
    );
};

const determineIfFolderIsAdult = (folderName: string): boolean => {
    return folderName.split(' ')[0] === '*'; // "*" at the beggining of the folder name indicates adult content
};

const checkIfParentDirectoryExists = (directoryPath: string, excludedParents: string[]): string => {
    const parentDirectory = getParentDirectoryPath(directoryPath, excludedParents);

    // Animes that are still pending processing don't count as having a parent folder
    return excludedParents.includes(parentDirectory) ? '' : parentDirectory;
};

const getParentDirectoryPath = (directoryPath: string, excludedParents: string[]): string => {
    const parts = directoryPath.split('/');
    parts.pop();

    return excludedParents.includes(parts[parts.length - 1]) ? '' : parts.join('/');
};

interface JsonFileParams {
    outputFolderPath: string;
    data: Directory[] | string[] | Record<string, string[]>;
    fileName: string;
}

export const writeJsonFile = ({ outputFolderPath, data, fileName }: JsonFileParams): void => {
    if (!fs.existsSync(outputFolderPath)) {
        fs.mkdirSync(outputFolderPath, { recursive: true });
    }

    const fullFolderPath = path.resolve(outputFolderPath);

    if (!fs.existsSync(fullFolderPath)) {
        fs.mkdirSync(fullFolderPath, { recursive: true });
    }

    const jsonPath = path.join(fullFolderPath, fileName + '.json');
    fs.writeFileSync(jsonPath, JSON.stringify(data), 'utf-8');

    console.log(`✔ JSON written to: ${jsonPath}`);
};
