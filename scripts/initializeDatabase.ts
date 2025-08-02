import { scanSingleFolder, writeJsonFile } from '../src/services/diskService';
import dotenv from 'dotenv';
import {
    AnimeEpisode,
    AnimeEpisodeResponseStrapi,
    Directory,
    DirectoryResponseStrapi,
} from '../src/utils/typesDefinition';

import {
    getAllDirectories,
    getAllAnimeEpisodes,
    uploadDirectory,
    uploadBulkAnimeEpisodes,
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
        pendingToScan.forEach(dirPath => {
            const folderToRemoveFromPending = pendingToScan.indexOf(dirPath);
            pendingToScan.splice(folderToRemoveFromPending, 1);

            const scannedData = scanSingleFolder({
                dirPath,
                excludedParents,
                excludedFileExtensions: excludedExtensions,
            });

            finalResult.push(scannedData);
            pendingToScan.push(...scannedData.sub_directories);
        });
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
    console.log('Uploading parent-less directories to Strapi...');
    console.log('- - - - - - - - - - - - -');
    console.log(' ');

    const directoriesUploaded: DirectoryResponseStrapi[] = [];

    for (const directory of filteredDirectories) {
        if (directory.parent_directory) {
            console.log(`Skipping ${directory.display_name} since it has a parent directory.`);
            continue;
        }

        const uploadedDirectory = await uploadDirectory(directory);
        console.log(`Uploaded: ${directory.display_name}.`);

        await uploadBulkAnimeEpisodes(directory.anime_episodes, uploadedDirectory.id);
        console.log('Uploaded anime episodes: ', directory.anime_episodes);

        directoriesUploaded.push(uploadedDirectory);
    }

    console.log(' ');
    console.log('- - - - - - - - - - - - -');
    console.log('Uploading pending directories to Strapi...');
    console.log('- - - - - - - - - - - - -');
    console.log(' ');

    const directoriesPendingToUplad: Directory[] = filteredDirectories.filter(dir => dir.parent_directory);
    const totalParents: DirectoryResponseStrapi[] = [...directoriesUploaded, ...directoriesData];
    const failedDirectories: Directory[] = [];

    while (directoriesPendingToUplad.length > 0) {
        for (const directory of directoriesPendingToUplad) {
            const parentExistsOnStrapi = totalParents.find(
                possibleParent => possibleParent.directory_path === directory.parent_directory
            );
            const numberOfTries = directory.numberOfAttempts || 0;

            if (!parentExistsOnStrapi) {
                const indexToUpdate = directoriesPendingToUplad.findIndex(
                    pendingDir => pendingDir.directory_path === directory.directory_path
                );

                if (
                    indexToUpdate === -1 ||
                    (directory.numberOfAttempts !== undefined && directory.numberOfAttempts > 5)
                ) {
                    failedDirectories.push(directory);
                    continue;
                }

                directoriesPendingToUplad[indexToUpdate].numberOfAttempts = numberOfTries + 1;

                continue;
            }

            const uploadedDirectory = await uploadDirectory(directory);
            console.log(`Uploaded: ${directory.display_name}.`);

            await uploadBulkAnimeEpisodes(directory.anime_episodes, uploadedDirectory.id);
            console.log('Uploaded anime episodes: ', directory.anime_episodes);

            const indexToRemove = directoriesPendingToUplad.findIndex(
                uploadedDir => uploadedDir.directory_path === directory.directory_path
            );
            directoriesPendingToUplad.splice(indexToRemove, 1);

            directoriesUploaded.push(uploadedDirectory);
        }
    }

    console.log(' ');
    console.log('- - - - - - - - - - - - -');
    console.log('Finished initializing the database!');
    console.log('- - - - - - - - - - - - -');
    console.log(' ');

    if (failedDirectories.length > 0) {
        writeJsonFile({ outputFolderPath, data: failedDirectories, fileName: 'failed_directories' });
        console.log(
            'Some directories have failed to upload after 5 retries. You can check them in the ./db/failed_directories.json file.'
        );
    }
};

if (require.main === module) {
    main();
}
