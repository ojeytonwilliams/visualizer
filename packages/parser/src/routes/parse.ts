import { FastifyInstance } from 'fastify';

export async function parse(fastify: FastifyInstance) {
  fastify.post('/dependency-map', async () => {
    return { error: 'folderPath is required', code: 'MISSING_FOLDER_PATH' };
  });
}
