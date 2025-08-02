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

    if (!initiumIter) {
        console.error('INITIAL_PATH environment variable is not set.');
        return;
    }

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

    writeJsonFile({ outputFolderPath, data: [data], fileName: 'initium_iter' });
    writeJsonFile({ outputFolderPath, data: finalDirectoryResult, fileName: 'directories' });
    writeJsonFile({ outputFolderPath, data: finalAnimeEpisodeResult, fileName: 'anime_episodes' });
    writeJsonFile({ outputFolderPath, data: finalResult, fileName: 'full_data' });

    const strapiBaseUrl = process.env.STRAPI_API_HOST;
    const strapiApiKey = process.env.STRAPI_API_KEY;

    if (!strapiBaseUrl || !strapiApiKey) {
        console.error('STRAPI_API_HOST or STRAPI_API_KEY environment variable is not set.');
        return;
    }

    try {
        const directoriesResponse = await fetch(`${strapiBaseUrl}/api/directories/all`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + strapiApiKey,
            },
            method: 'GET',
        });
        const directoriesData = (await directoriesResponse.json()) as DirectoryResponseStrapi[];
        writeJsonFile({ outputFolderPath, data: directoriesData, fileName: 'strapi_directories' });
        console.log('Strapi directories data written to strapi_directories.json');

        const animeEpisodesResponse = await fetch(`${strapiBaseUrl}/api/anime-episodes/all`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + strapiApiKey,
            },
            method: 'GET',
        });
        const animeEpisodesData = (await animeEpisodesResponse.json()) as AnimeEpisodeResponseStrapi[];
        writeJsonFile({ outputFolderPath, data: animeEpisodesData, fileName: 'strapi_anime_episodes' });
        console.log('Strapi anime episodes data written to strapi_anime_episodes.json');
    } catch (error) {
        console.error('Error fetching data from Strapi:', error);
    }
};

if (require.main === module) {
    main();
}
