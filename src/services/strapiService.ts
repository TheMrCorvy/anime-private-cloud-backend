import { AnimeEpisode, AnimeEpisodeResponseStrapi, Directory, DirectoryResponseStrapi } from '../utils/typesDefinition';

export const uploadDirectory = async (directory: Directory): Promise<DirectoryResponseStrapi> => {
    const strapiBaseUrl = process.env.STRAPI_API_HOST;
    const strapiApiKey = process.env.STRAPI_API_KEY;

    if (!strapiBaseUrl || !strapiApiKey) {
        throw new Error('Strapi base URL or API key is not set in environment variables.');
    }

    const response = await fetch(`${strapiBaseUrl}/api/directories`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${strapiApiKey}`,
        },
        body: JSON.stringify({
            data: {
                display_name: directory.display_name,
                directory_path: directory.directory_path,
                adult: directory.adult,
            },
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to upload directory: ${response.statusText}`);
    }

    console.log('Uploaded directory: ' + directory.display_name);

    const data = (await response.json()) as any;

    return data.data as DirectoryResponseStrapi;
};

export interface DirectoryUpdate {
    anime_episodes?: number[];
    parent_directory?: number;
    sub_directories?: number[];
    directoryDocumentId: string;
    display_name: string;
}

export const patchDirectory = async (directory: DirectoryUpdate): Promise<DirectoryResponseStrapi | void> => {
    const strapiBaseUrl = process.env.STRAPI_API_HOST;
    const strapiApiKey = process.env.STRAPI_API_KEY;
    const directoryToUpdate: Record<string, number | number[]> = {};

    if (!strapiBaseUrl || !strapiApiKey) {
        throw new Error('Strapi base URL or API key is not set in environment variables.');
    }

    if (directory.anime_episodes && directory.anime_episodes.length > 0) {
        directoryToUpdate.anime_episodes = directory.anime_episodes;
    }

    if (directory.parent_directory !== undefined) {
        directoryToUpdate.parent_directory = directory.parent_directory;
    }

    if (directory.sub_directories && directory.sub_directories.length > 0) {
        directoryToUpdate.sub_directories = directory.sub_directories;
    }

    if (Object.keys(directoryToUpdate).length === 0) {
        console.log('No data was provided to send to strapi. ' + directory.display_name);
        return;
    }

    const response = await fetch(`${strapiBaseUrl}/api/directories/${directory.directoryDocumentId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${strapiApiKey}`,
        },
        body: JSON.stringify({
            data: directoryToUpdate,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to upload directory: ${response.statusText}`);
    }

    console.log('Patched directory: ' + directory.display_name);

    const data = (await response.json()) as any;

    return data.data as DirectoryResponseStrapi;
};

export const getAllDirectories = async (): Promise<DirectoryResponseStrapi[]> => {
    const strapiBaseUrl = process.env.STRAPI_API_HOST;
    const strapiApiKey = process.env.STRAPI_API_KEY;

    if (!strapiBaseUrl || !strapiApiKey) {
        throw new Error('Strapi base URL or API key is not set in environment variables.');
    }

    const response = await fetch(`${strapiBaseUrl}/api/directories/all?populate=sub_directories`, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${strapiApiKey}`,
        },
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch directories: ${response.statusText}`);
    }

    const data = (await response.json()) as DirectoryResponseStrapi[];

    return data;
};

export const uploadBulkAnimeEpisodes = async (
    animeEpisodes: AnimeEpisode[],
    parentDirectory: number
): Promise<AnimeEpisodeResponseStrapi[]> => {
    const strapiBaseUrl = process.env.STRAPI_API_HOST;
    const strapiApiKey = process.env.STRAPI_API_KEY;

    if (!strapiBaseUrl || !strapiApiKey) {
        throw new Error('Strapi base URL or API key is not set in environment variables.');
    }

    const response = await fetch(`${strapiBaseUrl}/api/anime-episodes/bulk`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${strapiApiKey}`,
        },
        body: JSON.stringify({
            data: animeEpisodes.map(animeEpisode => ({ ...animeEpisode, parent_directory: parentDirectory })),
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to upload anime episodes: ${response.statusText}`);
    }

    const data = (await response.json()) as any;

    console.log(
        'Uploaded anime episodes: ',
        animeEpisodes.map(animeEpisode => animeEpisode.display_name)
    );

    return data.data as AnimeEpisodeResponseStrapi[];
};

export const getAllAnimeEpisodes = async (): Promise<AnimeEpisodeResponseStrapi[]> => {
    const strapiBaseUrl = process.env.STRAPI_API_HOST;
    const strapiApiKey = process.env.STRAPI_API_KEY;

    if (!strapiBaseUrl || !strapiApiKey) {
        throw new Error('Strapi base URL or API key is not set in environment variables.');
    }

    const response = await fetch(`${strapiBaseUrl}/api/anime-episodes/all`, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${strapiApiKey}`,
        },
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch anime episodes: ${response.statusText}`);
    }

    const data = (await response.json()) as AnimeEpisodeResponseStrapi[];

    return data;
};
