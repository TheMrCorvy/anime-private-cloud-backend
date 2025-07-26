export interface Directory {
    display_name: string;
    directory_path: string;
    adult: boolean;
    parent_directory: string;
    sub_directories: string[];
    anime_episodes: AnimeEpisode[];
}

export interface AnimeEpisode {
    display_name: string;
    file_path: string;
    parent_directory: Directory;
}
