import { getFoldersWithMp4Files } from '../src/services/mapFoldersService';

const main = () => {
    const basePath = '/Volumes/Disco 22TB/Pendientes de procesamiento/* shuumatsu no harem';
    const data = getFoldersWithMp4Files(basePath);
    console.log(data);
};

if (require.main === module) {
    main();
}
