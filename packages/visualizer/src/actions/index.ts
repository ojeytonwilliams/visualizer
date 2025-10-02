import fs from 'node:fs';
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

import { getDependencyGraph } from '../../../parser/src/dep-mapper/index.js';

export const server = {
  getDependencyMap: defineAction({
    input: z.object({
      rootDir: z.string(),
    }),
    handler: async ({ rootDir }) => {
      if (!fs.existsSync(rootDir)) {
        throw Error(`${rootDir} does not exist`);
      }

      return await getDependencyGraph(rootDir);
    },
  }),
};
