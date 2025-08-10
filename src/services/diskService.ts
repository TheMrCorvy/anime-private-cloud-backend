import fs from 'fs';
import path from 'path';
import { AnimeEpisode, AnimeEpisodeResponseStrapi, Directory, DirectoryResponseStrapi } from '../utils/typesDefinition';

interface ScanSingleFolderParams {
    dirPath: string;
    excludedParents: string[];
    excludedFileExtensions: string[];
}

export const scanSingleFolder = ({
    dirPath,
    excludedParents,
    excludedFileExtensions,
}: ScanSingleFolderParams): Directory => {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    const folderIsAdult = determineIfFolderIsAdult(path.basename(dirPath));
    const displayName = !folderIsAdult ? path.basename(dirPath) : removeAsteriskFromFolderName(path.basename(dirPath));

    const result: Directory = {
        display_name: displayName,
        directory_path: dirPath,
        adult: folderIsAdult,
        parent_directory: getParentDirectoryPath(dirPath, excludedParents),
        sub_directories: [],
        anime_episodes: [],
    };

    for (const item of items) {
        if (item.isDirectory()) {
            result.sub_directories.push(path.join(dirPath, item.name));
        } else if (item.isFile() && !episodeShouldBeIgnored(item.name, excludedFileExtensions)) {
            result.anime_episodes.push({
                display_name: item.name.replace(/\.mp4$/, ''),
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

const episodeShouldBeIgnored = (fileName: string, excludedExtensions: string[]): boolean => {
    const ignoredPrefixes = ['.', '._', 'Thumbs.db', 'desktop.ini'];
    return (
        excludedExtensions.some(ext => fileName.endsWith(ext)) ||
        ignoredPrefixes.some(prefix => fileName.startsWith(prefix))
    );
};

const determineIfFolderIsAdult = (folderName: string): boolean => {
    return folderName.split(' ')[0] === '*'; // "*" at the beggining of the folder name indicates adult content
};

const getParentDirectoryPath = (directoryPath: string, excludedParents: string[]): string | null => {
    const parts = directoryPath.split('/');
    parts.pop();

    return excludedParents.includes(parts[parts.length - 1]) ? null : parts.join('/');
};

interface JsonFileParams {
    outputFolderPath: string;
    data: Directory[] | AnimeEpisode[] | DirectoryResponseStrapi[] | AnimeEpisodeResponseStrapi[];
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
    fs.writeFileSync(jsonPath, JSON.stringify({ amount_of_items: data.length, data: data }), 'utf-8');

    console.log(`✔ JSON written to: ${jsonPath}`);
};
