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

    const filteredDirectories = finalDirectoryResult.filter(
        dir => !directoriesData.some(existingDir => existingDir.directory_path === dir.directory_path)
    );
    const filteredAnimeEpisodes = finalAnimeEpisodeResult.filter(
        episode => !animeEpisodesData.some(existingEpisode => existingEpisode.file_path === episode.file_path)
    );

    console.log('- - - - - - - - - - - - -');
    console.log('Uploading filtered directories to Strapi...');
    console.log('- - - - - - - - - - - - -');
    console.log(' ');

    let uploadedDirectories: DirectoryResponseStrapi[] = [];

    if (filteredDirectories.length > 0) {
        writeJsonFile({
            outputFolderPath,
            data: filteredDirectories,
            fileName: 'filtered_directories',
        });

        try {
            const uploadDirectoriesResponse = await fetch(`${strapiBaseUrl}/api/directories/bulk`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + strapiApiKey,
                },
                method: 'POST',
                body: JSON.stringify({ data: filteredDirectories.map(dir => ({ ...dir, parent_directory: null })) }),
            });

            if (!uploadDirectoriesResponse.ok) {
                throw new Error('Failed to upload directories');
            }

            uploadedDirectories = (await uploadDirectoriesResponse.json()) as DirectoryResponseStrapi[];
            console.log('Directories uploaded successfully.');
        } catch (error) {
            console.error('Error uploading directories:', error);
            return;
        }
    }

    console.log(' ');
    console.log('- - - - - - - - - - - - -');
    console.log(
        "Getting IDs from strapi response and patching the directories that have a parent that isn't present on strapi..."
    );
    console.log('- - - - - - - - - - - - -');
    console.log(' ');

    interface DirectoriesToUpdate {
        id: number;
        parent_directory: number | null;
    }
    const filteredDirectoriesWithParent: DirectoriesToUpdate[] = [];

    filteredDirectories.forEach(localDir => {
        if (!localDir.parent_directory) {
            return;
        }

        const foundStrapiDir = uploadedDirectories.find(
            strapiDir => strapiDir.directory_path === localDir.directory_path
        );

        if (!foundStrapiDir) {
            throw new Error(`Directory not found in Strapi: ${localDir.directory_path}`);
        }

        localDir.id = foundStrapiDir.id;

        const findParent = uploadedDirectories.find(
            strapiDir => strapiDir.directory_path === localDir.parent_directory
        );

        if (!findParent) {
            throw new Error(`Parent directory not found in Strapi: ${localDir.parent_directory}`);
        }

        localDir.parent_directory = findParent ? findParent.id.toString() : null;
        filteredDirectoriesWithParent.push({
            id: localDir.id,
            parent_directory: findParent.id,
        });
    });

    console.log(' ');
    console.log('- - - - - - - - - - - - -');
    console.log('Adding the parent directories property to the directories that need it in strapi...');
    console.log('- - - - - - - - - - - - -');
    console.log(' ');

    if (filteredDirectoriesWithParent.length > 0) {
        try {
            const patchDirectoriesResponse = await fetch(`${strapiBaseUrl}/api/directories/bulk`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + strapiApiKey,
                },
                method: 'PATCH',
                body: JSON.stringify({ data: filteredDirectoriesWithParent }),
            });

            if (!patchDirectoriesResponse.ok) {
                throw new Error('Failed to patch directories');
            }

            console.log('Directories patched successfully.');
        } catch (error) {
            console.error('Error patching directories:', error);
        }
    }

    console.log(' ');
    console.log('- - - - - - - - - - - - -');
    console.log('Uploading anime episodes to Strapi...');
    console.log('- - - - - - - - - - - - -');
    console.log(' ');

    if (filteredAnimeEpisodes.length > 0) {
        try {
            const directoriesStored = await fetch(`${strapiBaseUrl}/api/directories/all`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + strapiApiKey,
                },
                method: 'GET',
            });
            directoriesData = (await directoriesStored.json()) as DirectoryResponseStrapi[];

            const uploadAnimeEpisodesResponse = await fetch(`${strapiBaseUrl}/api/anime-episodes/bulk`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + strapiApiKey,
                },
                method: 'POST',
                body: JSON.stringify({
                    data: filteredAnimeEpisodes.map(animeEpisode => ({
                        ...animeEpisode,
                        parent_directory:
                            directoriesData.find(dir => dir.directory_path === animeEpisode.parent_directory)?.id ||
                            null,
                    })),
                }),
            });

            if (!uploadAnimeEpisodesResponse.ok) {
                throw new Error('Failed to upload anime episodes');
            }

            console.log('Anime episodes uploaded successfully.');
        } catch (error) {
            console.error('Error uploading anime episodes:', error);
        }
    }

    console.log(' ');
    console.log('- - - - - - - - - - - - -');
    console.log('Database initialized successfully!');
    console.log('- - - - - - - - - - - - -');
    console.log(' ');
};

if (require.main === module) {
    main();
}
