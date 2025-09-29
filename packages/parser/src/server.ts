import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';

// ENVIRONMENT should be set, but NODE_ENV is there as a fallback so that the
// test runner can set it.
const environment = (process.env.ENVIRONMENT ||
  process.env.NODE_ENV ||
  'development') as 'production' | 'development' | 'test';

const envToLogger = {
  development: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
  production: true,
  test: false,
};

export const setup = async () => {
  const fastify = Fastify({
    logger: envToLogger[environment],
  });

  // Register CORS plugin
  await fastify.register(cors, {
    origin: 'http://localhost:4321', // TODO: make this configurable
  });
  await fastify.register(sensible);

  return fastify;
};
