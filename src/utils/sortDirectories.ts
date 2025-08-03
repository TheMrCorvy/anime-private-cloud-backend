import { Directory } from './typesDefinition';

const normalize = (path: string): string => path.replace(/\\/g, '/');

/**
 * Sort the directories depending on how many levels the parent has
 * The more levels they have, the later they will be on the array
 */
const sortDirectories = (directories: Directory[]): Directory[] => {
    const pendingToSort = directories.map(dir => ({ ...dir, parent_directory: dir.parent_directory || '' }));
    return pendingToSort.sort((directoryA, directoryB) => {
        const normalizedA = normalize(directoryA.parent_directory).split('/');

        const normalizedB = normalize(directoryB.parent_directory).split('/');

        return normalizedA.length - normalizedB.length;
    });
};

export default sortDirectories;
