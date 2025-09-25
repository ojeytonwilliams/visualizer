import Fastify from 'fastify';
import cors from '@fastify/cors';

const fastify = Fastify({
  logger: true
});

// Register CORS plugin
await fastify.register(cors, {
  origin: true
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Parse endpoint - placeholder for now
fastify.post('/api/parse', async (request, reply) => {
  const { folderPath } = request.body as { folderPath: string };
  
  if (!folderPath) {
    reply.code(400);
    return { error: 'folderPath is required' };
  }

  // TODO: Implement parsing logic
  return { 
    message: 'Parser endpoint ready', 
    folderPath,
    nodes: [],
    links: []
  };
});

// Start server
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Parser server running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
