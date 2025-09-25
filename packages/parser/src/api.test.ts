import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';

import { parse } from './routes/parse.js';

describe('/dependency-map endpoint', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify({ logger: false });

    // Register CORS plugin
    await app.register(cors, {
      origin: true,
    });

    // Mount the endpoint

    await app.register(parse);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /dependency-map', () => {
    it('should accept valid folder path', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/dependency-map',
        payload: {
          folderPath: '/path/to/project',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data).toEqual({
        success: true,
        folderPath: '/path/to/project',
        nodes: [],
        links: [],
      });
    });

    it('should return 400 when folderPath is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/dependency-map',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data).toEqual({
        error: 'folderPath is required',
        code: 'MISSING_FOLDER_PATH',
      });
    });

    it('should return 400 when folderPath is not a string', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/dependency-map',
        payload: {
          folderPath: 123,
        },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data).toEqual({
        error: 'folderPath must be a string',
        code: 'INVALID_FOLDER_PATH_TYPE',
      });
    });

    it('should return 400 when folderPath is empty string', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/dependency-map',
        payload: {
          folderPath: '   ',
        },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data).toEqual({
        error: 'folderPath cannot be empty',
        code: 'EMPTY_FOLDER_PATH',
      });
    });

    it('should return 400 when request body is not valid JSON', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/dependency-map',
        payload: 'invalid json',
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data).toEqual({
        error: 'Request body must be a JSON object',
        code: 'INVALID_BODY',
      });
    });

    it('should return 400 when request body is null', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/dependency-map',
        headers: {
          'content-type': 'application/json',
        },
        payload: 'null',
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data).toEqual({
        error: 'Request body must be a JSON object',
        code: 'INVALID_BODY',
      });
    });

    it('should handle absolute paths', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/dependency-map',
        payload: {
          folderPath: '/home/user/project',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.folderPath).toBe('/home/user/project');
    });

    it('should handle relative paths', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/dependency-map',
        payload: {
          folderPath: './src/components',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.folderPath).toBe('./src/components');
    });
  });
});
