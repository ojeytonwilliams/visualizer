import { FastifyInstance } from 'fastify';

import { parse } from '../modules/file-parser.js';
import { scanDirectory } from '../modules/scanner.js';

export async function parser(fastify: FastifyInstance) {
  fastify.post('/dependency-map', async req => {
    const folderPath = (req.body as { folderPath: string }).folderPath;
    req.log.info('Received request to parse folder:' + folderPath);
    const files = await scanDirectory(folderPath);
    const dependencyMap = await parse(files);
    return { success: true, folderPath, dependencyMap };
  });
}
