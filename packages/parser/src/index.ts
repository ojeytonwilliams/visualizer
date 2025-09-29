import { parser } from './routes/parse.js';
import { healthCheck } from './routes/health-check.js';
import { setup } from './server.js';

// Start server
const start = async () => {
  const fastify = await setup();
  try {
    await fastify.register(healthCheck);
    await fastify.register(parser);
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Parser server running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
