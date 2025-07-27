import { scanSingleFolder, writeJsonFile } from '../src/services/diskService';
import dotenv from 'dotenv';
import { Directory } from '../src/utils/typesDefinition';

const main = () => {
    dotenv.config();
    const initiumIter = process.env.INITIAL_PATH || '';
    const outputFolderPath = './db';

    if (!initiumIter) {
        console.error('INITIAL_PATH environment variable is not set.');
        return;
    }

    const data = scanSingleFolder(initiumIter);

    writeJsonFile({ outputFolderPath, data: [data], fileName: 'initium_iter' });
    writeJsonFile({ outputFolderPath, data: { pending_to_scan: data.sub_directories }, fileName: 'pending_to_scan' });

    const finalResult: Directory[] = [];

    data.sub_directories.forEach(subDir => {
        const scannedData = scanSingleFolder(subDir);
        finalResult.push(scannedData);
    });

    writeJsonFile({ outputFolderPath, data: finalResult, fileName: '1_level_scan' });
};

if (require.main === module) {
    main();
}
