import { scanSingleFolder, writeJsonFile } from '../src/services/diskService';
import dotenv from 'dotenv';
import { Directory } from '../src/utils/typesDefinition';

const main = () => {
    dotenv.config();
    const initiumIter = process.env.INITIAL_PATH || '';
    const outputFolderPath = './db';
    const excludedParents = process.env.EXCLUDED_PARENTS ? JSON.parse(process.env.EXCLUDED_PARENTS) : [];
    const excludedExtensions = process.env.EXCLUDED_EXTENSIONS ? JSON.parse(process.env.EXCLUDED_EXTENSIONS) : [];

    if (!initiumIter) {
        console.error('INITIAL_PATH environment variable is not set.');
        return;
    }

    const data = scanSingleFolder({
        dirPath: initiumIter,
        excludedParents,
        excludedFileExtensions: excludedExtensions,
    });
    const pendingToScan: string[] = data.sub_directories;
    const finalResult: Directory[] = [];

    while (pendingToScan.length > 0) {
        pendingToScan.forEach(dirPath => {
            const folderToRemoveFromPending = pendingToScan.indexOf(dirPath);
            pendingToScan.splice(folderToRemoveFromPending, 1);

            const scannedData = scanSingleFolder({
                dirPath,
                excludedParents,
                excludedFileExtensions: excludedExtensions,
            });
            finalResult.push(scannedData);
            pendingToScan.push(...scannedData.sub_directories);
        });
    }

    writeJsonFile({ outputFolderPath, data: [data], fileName: 'initium_iter' });
    writeJsonFile({ outputFolderPath, data: finalResult, fileName: 'full_scan' });
};

if (require.main === module) {
    main();
}
