import { scanSingleFolder, writeJsonFile } from '../src/services/diskService';
import dotenv from 'dotenv';
import { Directory, DirectoryResponseStrapi } from '../src/utils/typesDefinition';

import sortDirectories from '../src/utils/sortDirectories';

import {
    getAllDirectories,
    uploadBulkAnimeEpisodes,
    DirectoryUpdate,
    updateDirectory,
    uploadDirectoryBulk,
} from '../src/services/strapiService';
import separateArrays from '../src/utils/separateArrays';

const main = async () => {
    dotenv.config();
    const initiumIter = process.env.INITIAL_PATH || '';
    const outputFolderPath = './db';
    const excludedParents = process.env.EXCLUDED_PARENTS ? JSON.parse(process.env.EXCLUDED_PARENTS) : [];
    const excludedExtensions = process.env.EXCLUDED_EXTENSIONS ? JSON.parse(process.env.EXCLUDED_EXTENSIONS) : [];
    const strapiBaseUrl = process.env.STRAPI_API_HOST;
    const strapiApiKey = process.env.STRAPI_API_KEY;

    if (!initiumIter || !strapiBaseUrl || !strapiApiKey || !excludedExtensions || !excludedParents) {
        throw new Error('Environment variables are not set.');
    }

    console.log(' ');
    console.log('- - - - - - - - - - - - -');
    console.log('Environment variables set. Proceeding with database initialization...');
    console.log('- - - - - - - - - - - - -');
    console.log(' ');

    const data = scanSingleFolder({
        dirPath: initiumIter,
        excludedParents,
        excludedFileExtensions: excludedExtensions,
    });

    const pendingToScan: string[] = data.sub_directories;
    const finalResult: Directory[] = [];

    while (pendingToScan.length > 0) {
        for (let index = pendingToScan.length - 1; index >= 0; index--) {
            const dirPath = pendingToScan[index];
            const folderToRemoveFromPending = pendingToScan.indexOf(dirPath);
            pendingToScan.splice(folderToRemoveFromPending, 1);

            const scannedData = scanSingleFolder({
                dirPath,
                excludedParents,
                excludedFileExtensions: excludedExtensions,
            });

            if (scannedData.display_name !== 'Pendientes') {
                finalResult.push(scannedData);
            }
            pendingToScan.push(...scannedData.sub_directories);
        }
    }

    console.log('- - - - - - - - - - - - -');
    console.log('Scanned all directories for root folder. Now writting into json db...');
    console.log('- - - - - - - - - - - - -');
    console.log(' ');

    writeJsonFile({ outputFolderPath, data: finalResult, fileName: 'full_data' });

    console.log(' ');
    console.log('- - - - - - - - - - - - -');
    console.log('Json db written. Calling Strapi to get already existing Drirectories and Anime Episodes...');
    console.log('- - - - - - - - - - - - -');
    console.log(' ');

    let directoriesData: DirectoryResponseStrapi[] = await getAllDirectories();

    console.log('- - - - - - - - - - - - -');
    console.log('Writting Strapi response into json db...');
    console.log('- - - - - - - - - - - - -');
    console.log(' ');

    writeJsonFile({ outputFolderPath, data: directoriesData, fileName: 'strapi_directories' });

    console.log(' ');
    console.log('- - - - - - - - - - - - -');
    console.log('Contrasting local files and folders against strapi data...');
    console.log('- - - - - - - - - - - - -');
    console.log(' ');

    const filteredDirectories = finalResult.filter(
        dir => !directoriesData.some(existingDir => existingDir.directory_path === dir.directory_path)
    );

    writeJsonFile({
        outputFolderPath,
        data: filteredDirectories,
        fileName: 'pending_to_upload',
    });

    console.log(' ');
    console.log('- - - - - - - - - - - - -');
    console.log('Uploading directories...');
    console.log('- - - - - - - - - - - - -');
    console.log(' ');

    const pendingDirectories = sortDirectories([...filteredDirectories]);
    const separatedPendingDirectories = separateArrays(pendingDirectories, 50);

    for (const directoryChunk of separatedPendingDirectories) {
        console.log(
            'Uploading chunks of directories to Strapi...',
            directoryChunk.map(dir => dir.display_name)
        );

        await uploadDirectoryBulk(directoryChunk);
    }

    console.log(' ');
    console.log('- - - - - - - - - - - - -');
    console.log('Uploaded all directories! Now uploading anime episodes and updating directories...');
    console.log('- - - - - - - - - - - - -');
    console.log(' ');

    const updatedStrapidata = await getAllDirectories();
    const failedDirectories: Directory[] = [];

    for (const directoryPendingToUpdate of pendingDirectories) {
        const strapiDirectory = updatedStrapidata.find(
            dir => dir.directory_path === directoryPendingToUpdate.directory_path
        );

        if (!strapiDirectory) {
            console.warn(`Directory ${directoryPendingToUpdate.display_name} not found in Strapi. Skipping update.`);

            failedDirectories.push(directoryPendingToUpdate);
            continue;
        }

        const separatedAnimeEpisodes = separateArrays(directoryPendingToUpdate.anime_episodes, 50);
        const uploadedAnimeEpisodesIds: number[] = [];
        const patch: DirectoryUpdate = {
            id: strapiDirectory.id,
            directoryDocumentId: strapiDirectory.documentId,
            display_name: directoryPendingToUpdate.display_name,
        };

        for (const animeEpisodesChunk of separatedAnimeEpisodes) {
            console.log('Uploading chunk of anime episodes', {
                parent: directoryPendingToUpdate.display_name,
                animeEpisodesChunk: animeEpisodesChunk.map(ep => ep.display_name),
            });
            console.log(' ');

            const response = await uploadBulkAnimeEpisodes(animeEpisodesChunk, strapiDirectory.id);
            uploadedAnimeEpisodesIds.push(...response.map(ep => ep.id));

            console.log(' ');
        }

        if (directoryPendingToUpdate.anime_episodes.length > 0) {
            patch.anime_episodes = uploadedAnimeEpisodesIds;
        }

        if (directoryPendingToUpdate.parent_directory) {
            const parentDirectory = updatedStrapidata.find(
                dir => dir.directory_path === directoryPendingToUpdate.parent_directory
            );

            if (!parentDirectory) {
                console.warn(
                    `Parent directory ${directoryPendingToUpdate.parent_directory} not found in Strapi. Skipping update.`
                );

                failedDirectories.push(directoryPendingToUpdate);
                continue;
            }

            patch.parent_directory = parentDirectory.id;
        }

        if (directoryPendingToUpdate.sub_directories.length > 0) {
            const subDirectories = updatedStrapidata
                .filter(dir => directoryPendingToUpdate.sub_directories.includes(dir.directory_path))
                .map(dir => dir.id);

            if (subDirectories.length !== directoryPendingToUpdate.sub_directories.length) {
                console.warn(
                    `Subdirectories for ${directoryPendingToUpdate.display_name} not found in Strapi. Skipping update.`
                );
                failedDirectories.push(directoryPendingToUpdate);
                continue;
            }

            patch.sub_directories = subDirectories;
        }

        console.log('Updating directory in Strapi', {
            directory: directoryPendingToUpdate.display_name,
            patch,
        });
        console.log(' ');
        await updateDirectory(patch);
    }

    if (failedDirectories.length > 0) {
        console.warn(
            'Some directories failed to update:',
            failedDirectories.map(dir => dir.display_name)
        );
        console.warn('You may need to check these directories manually.');

        writeJsonFile({
            outputFolderPath,
            data: failedDirectories,
            fileName: 'failed_directories',
        });
    }

    console.log(' ');
    console.log('- - - - - - - - - - - - -');
    console.log('Database is fully operative!');
    console.log('- - - - - - - - - - - - -');
    console.log(' ');
};

if (require.main === module) {
    main();
}
