import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { fs, vol } from 'memfs';

import { parser } from './parse.js';
import { setup } from '../server.js';

vi.mock('fs');

describe('/dependency-map endpoint', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vol.mkdirSync('/path/to/project', { recursive: true });
    app = await setup();

    await app.register(parser);
  });

  afterEach(async () => {
    await app.close();
    vol.reset(); // Reset the in-memory file system
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

      const data = JSON.parse(response.payload);
      expect(data).toEqual({
        success: true,
        folderPath: '/path/to/project',
        dependencyMap: {
          nodes: [],
          links: [],
        },
      });
      expect(response.statusCode).toBe(200);
    });

    it('should return 400 when folderPath is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/dependency-map',
        payload: {},
      });

      const data = JSON.parse(response.payload);
      expect(data).toEqual({
        error: 'Bad Request',
        message: 'Folder does not exist',
        statusCode: 400,
      });
      expect(response.statusCode).toBe(400);
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
