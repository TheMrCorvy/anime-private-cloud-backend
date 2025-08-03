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

    const data = (await response.json()) as DirectoryResponseStrapi;

    return data;
};

export interface DirectoryUpdate {
    anime_episodes?: number[];
    parent_directory?: number;
    sub_directoryes?: number[];
    directoryDocumentId: string;
    display_name: string;
}

export const updateDirectory = async (directory: DirectoryUpdate): Promise<DirectoryResponseStrapi> => {
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

    if (directory.sub_directoryes && directory.sub_directoryes.length > 0) {
        directoryToUpdate.sub_directoryes = directory.sub_directoryes;
    }

    if (Object.keys(directoryToUpdate).length === 0) {
        console.log('Nothing to update. ' + directory.display_name);
    }

    const response = await fetch(`${strapiBaseUrl}/api/directories/${directory.directoryDocumentId}`, {
        method: 'PATCH',
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

    const data = (await response.json()) as DirectoryResponseStrapi;

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

    const data = (await response.json()) as AnimeEpisodeResponseStrapi[];

    return data;
};

export const getAllDirectories = async (): Promise<DirectoryResponseStrapi[]> => {
    const strapiBaseUrl = process.env.STRAPI_API_HOST;
    const strapiApiKey = process.env.STRAPI_API_KEY;

    if (!strapiBaseUrl || !strapiApiKey) {
        throw new Error('Strapi base URL or API key is not set in environment variables.');
    }

    const response = await fetch(`${strapiBaseUrl}/api/directories/all`, {
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
