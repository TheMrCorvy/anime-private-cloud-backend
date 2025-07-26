import { scanSingleFolder } from '../src/services/mapFoldersService';

const main = () => {
    const basePath = '/Volumes/Disco 22TB/Pendientes de procesamiento/* shuumatsu no harem';
    const data = scanSingleFolder(basePath);
    console.log(data);
};

if (require.main === module) {
    main();
}
