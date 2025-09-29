import { FastifyInstance } from 'fastify';

import { parse } from '../modules/file-parser.js';
import { scanDirectory } from '../modules/scanner.js';

export async function parser(fastify: FastifyInstance) {
  fastify.post('/dependency-map', async req => {
    const folderPath = (req.body as { folderPath: string }).folderPath;
    req.log.info('Received request to parse folder:' + folderPath);
    console.time('scanning');
    const files = await scanDirectory(folderPath);
    console.timeEnd('scanning');
    console.time('parsing');
    const dependencyMap = await parse(files);
    console.timeEnd('parsing');
    return { success: true, folderPath, dependencyMap };
  });
}
