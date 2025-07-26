import fs from 'fs';
import path from 'path';
import { Directory } from '../utils/typesDefinition';

export const scanSingleFolder = (dirPath: string): Directory => {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    const result: Directory = {
        display_name: path.basename(dirPath),
        directory_path: dirPath,
        adult: determineIfFolderIsAdult(path.basename(dirPath)),
        parent_directory: checkIfParentDirectoryExists(dirPath),
        sub_directories: [],
        anime_episodes: [],
    };

    for (const item of items) {
        if (item.isDirectory()) {
            result.sub_directories.push(path.join(dirPath, item.name));
        } else {
            result.anime_episodes.push({
                display_name: item.name,
                file_path: path.join(dirPath, item.name),
                parent_directory: result,
            });
        }
    }

    return result;
};

const determineIfFolderIsAdult = (folderName: string): boolean => {
    return folderName.split(' ')[0] === '*';
};

const checkIfParentDirectoryExists = (directoryPath: string): string => {
    const parentDirectory = getParentDirectoryPath(directoryPath);
    return parentDirectory === 'pendientes' || parentDirectory === 'Pendientes de procesamiento' ? '' : parentDirectory;
};

const getParentDirectoryPath = (directoryPath: string): string => {
    const parts = directoryPath.split('/');
    parts.pop();

    const excludedDirectories = ['pendientes', 'Pendientes de procesamiento'];

    return excludedDirectories.includes(parts[parts.length - 1]) ? '' : parts.join('/');
};
