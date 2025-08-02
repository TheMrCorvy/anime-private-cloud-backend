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
        body: JSON.stringify({ data: directory }),
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
