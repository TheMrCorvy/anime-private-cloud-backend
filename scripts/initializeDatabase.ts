import { scanSingleFolder, writeJsonFile } from '../src/services/diskService';
import dotenv from 'dotenv';
import {
    AnimeEpisode,
    AnimeEpisodeResponseStrapi,
    Directory,
    DirectoryResponseStrapi,
} from '../src/utils/typesDefinition';

const main = async () => {
    dotenv.config();
    const initiumIter = process.env.INITIAL_PATH || '';
    const outputFolderPath = './db';
    const excludedParents = process.env.EXCLUDED_PARENTS ? JSON.parse(process.env.EXCLUDED_PARENTS) : [];
    const excludedExtensions = process.env.EXCLUDED_EXTENSIONS ? JSON.parse(process.env.EXCLUDED_EXTENSIONS) : [];
    const strapiBaseUrl = process.env.STRAPI_API_HOST;
    const strapiApiKey = process.env.STRAPI_API_KEY;

    if (!initiumIter || !strapiBaseUrl || !strapiApiKey || !excludedExtensions || !excludedParents) {
        console.error('Environment variables are not set.');
        return;
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
    const finalDirectoryResult: Directory[] = [];
    const finalAnimeEpisodeResult: AnimeEpisode[] = [];
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
            finalDirectoryResult.push({ ...scannedData, anime_episodes: [] });
            finalAnimeEpisodeResult.push(...scannedData.anime_episodes);
            finalResult.push(scannedData);
            pendingToScan.push(...scannedData.sub_directories);
        });
    }

    console.log('- - - - - - - - - - - - -');
    console.log('Scanned all directories for root folder. Now writting into json db...');
    console.log('- - - - - - - - - - - - -');
    console.log(' ');

    writeJsonFile({ outputFolderPath, data: [data], fileName: 'initium_iter' });
    writeJsonFile({ outputFolderPath, data: finalDirectoryResult, fileName: 'directories' });
    writeJsonFile({ outputFolderPath, data: finalAnimeEpisodeResult, fileName: 'anime_episodes' });
    writeJsonFile({ outputFolderPath, data: finalResult, fileName: 'full_data' });

    console.log(' ');
    console.log('- - - - - - - - - - - - -');
    console.log('Json db written. Calling Strapi to get already existing Drirectories and Anime Episodes...');
    console.log('- - - - - - - - - - - - -');
    console.log(' ');

    let directoriesData: DirectoryResponseStrapi[] = [];
    let animeEpisodesData: AnimeEpisodeResponseStrapi[] = [];

    try {
        const directoriesResponse = await fetch(`${strapiBaseUrl}/api/directories/all`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + strapiApiKey,
            },
            method: 'GET',
        });
        const animeEpisodesResponse = await fetch(`${strapiBaseUrl}/api/anime-episodes/all`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + strapiApiKey,
            },
            method: 'GET',
        });

        console.log('- - - - - - - - - - - - -');
        console.log('Writting Strapi response into json db...');
        console.log('- - - - - - - - - - - - -');
        console.log(' ');

        directoriesData = (await directoriesResponse.json()) as DirectoryResponseStrapi[];
        writeJsonFile({ outputFolderPath, data: directoriesData, fileName: 'strapi_directories' });
        console.log('Strapi directories data written to strapi_directories.json');

        animeEpisodesData = (await animeEpisodesResponse.json()) as AnimeEpisodeResponseStrapi[];
        writeJsonFile({ outputFolderPath, data: animeEpisodesData, fileName: 'strapi_anime_episodes' });
        console.log('Strapi anime episodes data written to strapi_anime_episodes.json');
    } catch (error) {
        console.error('Error fetching data from Strapi:', error);
        return;
    }

    console.log(' ');
    console.log('- - - - - - - - - - - - -');
    console.log('Contrasting local files and folders against strapi data...');
    console.log('- - - - - - - - - - - - -');
    console.log(' ');

    console.log('- - - - - - - - - - - - -');
    console.log('Uploading filtered directories and anime episodes to Strapi...');
    console.log('- - - - - - - - - - - - -');
    console.log(' ');
};

if (require.main === module) {
    main();
}
