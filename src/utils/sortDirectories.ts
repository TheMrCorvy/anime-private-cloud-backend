import { Directory } from './typesDefinition';

const normalize = (path: string): string => path.replace(/\\/g, '/');

/**
 * Sort the directories depending on how many levels the parent has
 * The more levels they have, the later they will be on the array
 */
const sortDirectories = (directories: Directory[]): Directory[] => {
    const pendingToSort = directories.map(dir => ({ ...dir, parent_directory: dir.parent_directory || '' }));
    return pendingToSort.sort((directoryA, directoryB) => {
        const normalizedA = normalize(directoryA.parent_directory).split('/').filter(Boolean).length;

        const normalizedB = normalize(directoryB.parent_directory).split('/').filter(Boolean).length;

        if (normalizedA !== normalizedB) {
            return normalizedA - normalizedB; // Sort by depth first
        }

        return directoryA.parent_directory.localeCompare(directoryB.parent_directory);
    });
};

export default sortDirectories;
