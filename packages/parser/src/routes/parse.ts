import type { FastifyPluginCallback } from 'fastify';
import fs from 'node:fs';

import { parse } from '../modules/file-parser.js';
import { scanDirectory } from '../modules/scanner.js';

export const parser: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.post('/dependency-map', async req => {
    const folderPath = (req.body as { folderPath: string }).folderPath;
    if (!fs.existsSync(folderPath)) {
      throw fastify.httpErrors.badRequest('Folder does not exist');
    }
    const files = await scanDirectory(folderPath);
    const dependencyMap = await parse(files);
    return { success: true, folderPath, dependencyMap };
  });
  done();
};
