import { scanSingleFolder, writeJsonFile } from '../src/services/diskService';
import dotenv from 'dotenv';
import { Directory } from '../src/utils/typesDefinition';

import fs from 'fs';
import path from 'path';

interface FolderNode {
    name: string;
    path: string;
    children: FolderNode[];
}

interface FlatFolder {
    name: string;
    path: string;
    parent: string | null;
}

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

    const rootNode: FolderNode = {
        name: path.basename(initiumIter),
        path: initiumIter,
        children: [],
    };

    const queue: { dirPath: string; node: FolderNode }[] = [{ dirPath: initiumIter, node: rootNode }];

    while (queue.length > 0) {
        const { dirPath, node } = queue.shift()!;

        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const childPath = path.join(dirPath, entry.name);
                const childNode: FolderNode = {
                    name: entry.name,
                    path: childPath,
                    children: [],
                };
                node.children.push(childNode);
                queue.push({ dirPath: childPath, node: childNode });
            }
        }
    }

    function flattenFolderTreeToArray(root: FolderNode): FlatFolder[] {
        const result: FlatFolder[] = [];
        const stack: { node: FolderNode; parent: string | null }[] = [{ node: root, parent: null }];

        while (stack.length > 0) {
            const { node, parent } = stack.pop()!;
            result.push({
                name: node.name,
                path: node.path,
                parent: parent,
            });

            for (const child of node.children) {
                stack.push({ node: child, parent: node.path });
            }
        }

        return result;
    }

    writeJsonFile({
        outputFolderPath,
        data: flattenFolderTreeToArray(rootNode),
        fileName: 'folder_structure',
    });
};

if (require.main === module) {
    main();
}
