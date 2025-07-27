import { scanSingleFolder, writeJsonFile } from '../src/services/diskService';
import dotenv from 'dotenv';

const main = () => {
    dotenv.config();
    const initiumIter = process.env.INITIAL_PATH || '';
    const outputFolderPath = './db';

    if (!initiumIter) {
        console.error('INITIAL_PATH environment variable is not set.');
        return;
    }

    const data = scanSingleFolder(initiumIter);

    writeJsonFile(outputFolderPath, [data]);
};

if (require.main === module) {
    main();
}
