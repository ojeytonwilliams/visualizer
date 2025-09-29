import type { FastifyPluginCallback } from 'fastify';

export const healthCheck: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
  done();
};
