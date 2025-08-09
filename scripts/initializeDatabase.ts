import { scanSingleFolder, writeJsonFile } from '../src/services/diskService';
import dotenv from 'dotenv';
import { AnimeEpisodeResponseStrapi, Directory, DirectoryResponseStrapi } from '../src/utils/typesDefinition';

import sortDirectories from '../src/utils/sortDirectories';

import {
    getAllDirectories,
    uploadDirectory,
    uploadBulkAnimeEpisodes,
    DirectoryUpdate,
    updateDirectory,
} from '../src/services/strapiService';
import fakeApiCall from '../mock/mockApiCall';

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
};

if (require.main === module) {
    main();
}
