export interface Directory {
    display_name: string;
    directory_path: string;
    adult: boolean;
    parent_directory: string | null;
    sub_directories: string[];
    anime_episodes: AnimeEpisode[];
    reasonOfFailure?: string;
}

export interface AnimeEpisode {
    display_name: string;
    file_path: string;
    parent_directory: string;
}

export interface DirectoryResponseStrapi {
    id: number;
    display_name: string;
    directory_path: string;
    createdAt: Date;
    updatedAt: Date;
    adult: boolean;
    documentId: string;
    locale: null | string;
    publishedAt: Date | null;
    parent_directory?: number;
    sub_directories?: number[];
    anime_episodes?: number[];
}

export interface AnimeEpisodeResponseStrapi {
    id: number;
    display_name: string;
    file_path: string;
    createdAt: Date;
    updatedAt: Date;
    documentId: string;
    locale: string | null;
    publishedAt: Date | null;
    parent_directory?: number;
}
