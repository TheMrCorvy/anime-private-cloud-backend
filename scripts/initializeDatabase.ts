import { scanSingleFolder, writeJsonFile } from '../src/services/diskService';
import dotenv from 'dotenv';
import { AnimeEpisodeResponseStrapi, Directory, DirectoryResponseStrapi } from '../src/utils/typesDefinition';

import sortDirectories from '../src/utils/sortDirectories';

import {
    getAllDirectories,
    getAllAnimeEpisodes,
    uploadDirectory,
    uploadBulkAnimeEpisodes,
    DirectoryUpdate,
    updateDirectory,
} from '../src/services/strapiService';

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
        for (const dirPath of pendingToScan) {
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

    writeJsonFile({ outputFolderPath, data: finalResult, fileName: 'directories' });
    writeJsonFile({ outputFolderPath, data: finalResult, fileName: 'full_data' });

    console.log(' ');
    console.log('- - - - - - - - - - - - -');
    console.log('Json db written. Calling Strapi to get already existing Drirectories and Anime Episodes...');
    console.log('- - - - - - - - - - - - -');
    console.log(' ');

    let directoriesData: DirectoryResponseStrapi[] = await getAllDirectories();
    let animeEpisodesData: AnimeEpisodeResponseStrapi[] = await getAllAnimeEpisodes();

    console.log('- - - - - - - - - - - - -');
    console.log('Writting Strapi response into json db...');
    console.log('- - - - - - - - - - - - -');
    console.log(' ');

    writeJsonFile({ outputFolderPath, data: directoriesData, fileName: 'strapi_directories' });
    writeJsonFile({ outputFolderPath, data: animeEpisodesData, fileName: 'strapi_anime_episodes' });

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
    console.log('Uploading Parent-less directories first, then the folders that do have a parent...');
    console.log('- - - - - - - - - - - - -');
    console.log(' ');

    const pendingDirectories = sortDirectories([...filteredDirectories]);
    const directoriesInStrapi = [...directoriesData];
    const failedDirectories: Directory[] = [];

    for (let index = pendingDirectories.length - 1; index >= 0; index--) {
        const pendingDirectory = pendingDirectories[index];

        if (pendingDirectory.parent_directory) continue;

        const uploadedDir = await uploadDirectory(pendingDirectory);

        if (!uploadedDir.documentId) {
            throw new Error(`There was a problem uploading the directory ${pendingDirectory.display_name}.`);
        }

        if (
            !(pendingDirectory.anime_episodes.length > 0) &&
            !pendingDirectory.parent_directory &&
            !(pendingDirectory.sub_directories.length > 0)
        ) {
            continue;
        }

        let uploadedAnimeEpisodes: AnimeEpisodeResponseStrapi[] = [];

        if (pendingDirectory.anime_episodes.length > 0) {
            uploadedAnimeEpisodes = await uploadBulkAnimeEpisodes(pendingDirectory.anime_episodes, uploadedDir.id);
        }

        const directoryToUpdate: DirectoryUpdate = {
            directoryDocumentId: uploadedDir.documentId,
            display_name: pendingDirectory.display_name,
        };

        if (uploadedAnimeEpisodes.length > 0) {
            directoryToUpdate.anime_episodes = uploadedAnimeEpisodes.map(animeEpisode => animeEpisode.id);
        }

        const parentDirExists = directoriesInStrapi.find(
            dir => dir.directory_path === pendingDirectory.parent_directory
        );

        if (parentDirExists) {
            directoryToUpdate.parent_directory = parentDirExists.id;
        }

        const updatedDir = await updateDirectory(directoryToUpdate);
        if (!parentDirExists && pendingDirectory.parent_directory) {
            failedDirectories.push(pendingDirectory);
        } else {
            directoriesInStrapi.push({ ...uploadedDir, ...updatedDir });
        }
        pendingDirectories.splice(index, 1);
    }

    console.log(' ');
    console.log('- - - - - - - - - - - - -');
    console.log('Finished iterating through the array of directories.');
    console.log('- - - - - - - - - - - - -');
    console.log(' ');

    if (failedDirectories.length > 0) {
        writeJsonFile({ outputFolderPath, data: failedDirectories, fileName: 'failed_directories' });
        console.log(' ');
        console.log('- - - - - - - - - - - - -');
        console.log(
            'Some directories have failed to upload. You may want to take a look into ./db/failed_diretories.json'
        );
        console.log('- - - - - - - - - - - - -');
        console.log(' ');
    }
};

if (require.main === module) {
    main();
}
