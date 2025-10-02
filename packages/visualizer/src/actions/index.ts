import fs from 'node:fs';
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

import { scanDirectory } from '../modules/scanner';
import { parse } from '../modules/file-parser';

export const server = {
  getDependencyMap: defineAction({
    input: z.object({
      rootDir: z.string(),
    }),
    handler: async ({ rootDir }) => {
      if (!fs.existsSync(rootDir)) {
        throw Error(`${rootDir} does not exist`);
      }
      const files = await scanDirectory(rootDir);
      const dependencyMap = await parse(files);

      return { dependencyMap };
    },
  }),
};
