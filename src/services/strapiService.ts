import { AnimeEpisode, AnimeEpisodeResponseStrapi, Directory, DirectoryResponseStrapi } from '../utils/typesDefinition';

export const uploadDirectory = async (directory: Directory): Promise<DirectoryResponseStrapi | null> => {
    try {
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (await response.json()) as any;

        return data.data as DirectoryResponseStrapi;
    } catch (error) {
        console.error('Error uploading directory:', error);
        return null;
    }
};

export const uploadDirectoryBulk = async (directories: Directory[]): Promise<DirectoryResponseStrapi[] | null> => {
    try {
        const strapiBaseUrl = process.env.STRAPI_API_HOST;
        const strapiApiKey = process.env.STRAPI_API_KEY;

        if (!strapiBaseUrl || !strapiApiKey) {
            throw new Error('Strapi base URL or API key is not set in environment variables.');
        }

        const response = await fetch(`${strapiBaseUrl}/api/directories/bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${strapiApiKey}`,
            },
            body: JSON.stringify({
                data: directories.map(dir => ({
                    display_name: dir.display_name,
                    directory_path: dir.directory_path,
                    adult: dir.adult,
                })),
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to upload directory: ${response.statusText}`);
        }

        console.log(
            'Uploaded directories:',
            directories.map(dir => dir.display_name)
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (await response.json()) as any;

        return data.data as DirectoryResponseStrapi[];
    } catch (error) {
        console.error('Error uploading directories:', error);
        return null;
    }
};

export interface DirectoryUpdate {
    anime_episodes?: number[];
    parent_directory?: number;
    sub_directories?: number[];
    directoryDocumentId: string;
    display_name: string;
    id: number;
}

export const updateDirectory = async (directory: DirectoryUpdate): Promise<DirectoryResponseStrapi | 1 | null> => {
    try {
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
            return 1;
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (await response.json()) as any;

        return data.data as DirectoryResponseStrapi;
    } catch (error) {
        console.error('Error updating directory:', error);
        return null;
    }
};

export const updateDirectoryBulk = async (
    directories: DirectoryUpdate[]
): Promise<DirectoryResponseStrapi | 1 | null> => {
    try {
        const strapiBaseUrl = process.env.STRAPI_API_HOST;
        const strapiApiKey = process.env.STRAPI_API_KEY;
        const directoriesToUpdate: Record<string, number | number[]>[] = [];

        if (!strapiBaseUrl || !strapiApiKey) {
            throw new Error('Strapi base URL or API key is not set in environment variables.');
        }

        directories.forEach(directory => {
            const updateData: Record<string, number | number[]> = {};

            if (directory.anime_episodes && directory.anime_episodes.length > 0) {
                updateData.anime_episodes = directory.anime_episodes;
            }

            if (directory.parent_directory !== undefined) {
                updateData.parent_directory = directory.parent_directory;
            }

            if (directory.sub_directories && directory.sub_directories.length > 0) {
                updateData.sub_directories = directory.sub_directories;
            }

            if (Object.keys(updateData).length > 0) {
                directoriesToUpdate.push(updateData);
            }
        });
        const response = await fetch(`${strapiBaseUrl}/api/directories/bulk`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${strapiApiKey}`,
            },
            body: JSON.stringify({
                data: directoriesToUpdate,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to upload directory: ${response.statusText}`);
        }

        console.log(
            'Patched directories:',
            directories.map(dir => dir.display_name)
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (await response.json()) as any;

        return data.data as DirectoryResponseStrapi;
    } catch (error) {
        console.error('Error updating directories:', error);
        return null;
    }
};

export const getAllDirectories = async (): Promise<DirectoryResponseStrapi[]> => {
    const strapiBaseUrl = process.env.STRAPI_API_HOST;
    const strapiApiKey = process.env.STRAPI_API_KEY;

    if (!strapiBaseUrl || !strapiApiKey) {
        throw new Error('Strapi base URL or API key is not set in environment variables.');
    }

    const response = await fetch(
        `${strapiBaseUrl}/api/directories/all?populate[sub_directories]=*&populate[parent_directory]=*`,
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${strapiApiKey}`,
            },
            method: 'GET',
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch directories: ${response.statusText}`);
    }

    const data = (await response.json()) as any;

    return data.data as DirectoryResponseStrapi[];
};

export const uploadBulkAnimeEpisodes = async (
    animeEpisodes: AnimeEpisode[],
    parentDirectory: number
): Promise<AnimeEpisodeResponseStrapi[] | null> => {
    try {
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (await response.json()) as any;

        console.log(
            'Uploaded anime episodes: ',
            animeEpisodes.map(animeEpisode => animeEpisode.display_name)
        );

        return data.data as AnimeEpisodeResponseStrapi[];
    } catch (error) {
        console.error('Error uploading anime episodes:', error);
        return null;
    }
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
