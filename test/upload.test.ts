import type { FastifyInstance } from 'fastify';
import type { DatabaseSync } from 'node:sqlite';
import { createFile, sha1, createMultipartPayload } from './helpers.ts';
import { test, describe, beforeEach, afterEach } from 'node:test';
import { DatabaseSync as DB } from 'node:sqlite';
import { unlinkSync } from 'node:fs';
import { buildApp } from '../src/app.ts';
import assert from 'node:assert';

let db: DatabaseSync;
let app: FastifyInstance;

describe('Upload API Tests', () => {
    beforeEach(async () => {
        db = new DB(':memory:');
        db.exec(`
            CREATE TABLE IF NOT EXISTS uploads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                size INTEGER NOT NULL,
                hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        app = await buildApp(db);
    });

    afterEach(async () => {
        await app.close();
    });

    test('should upload file successfully and store in database', async () => {
        const content = 'Hello, this is a test file!';
        const filename = 'test.txt';
        createFile(filename, content);
        const { payload, boundary } = createMultipartPayload([filename]);

        const response = await app.inject({
            method: 'POST',
            url: '/upload',
            payload,
            headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
        });
        const result = JSON.parse(response.payload);

        assert.strictEqual(response.statusCode, 200);
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.size, content.length);
        assert.strictEqual(result.data.hash, sha1(content));

        const stmt = db.prepare('SELECT * FROM uploads WHERE id = ?');
        const record = stmt.get(result.data.id);
        assert.ok(record);
        assert.strictEqual(record.size, content.length);
        assert.strictEqual(record.hash, sha1(content));

        unlinkSync(filename);
    });

    test('should only process 1 file (first) when multiple files are uploaded', async () => {
        // We perform 2 uploads here, one with a single file and another with multiple files.
        // Both of these uploads should store the same amount of bytes in the database.
        // This confirms that the API only processes the first file in a multipart request.

        const content = 'Mega Content';
        const filename1 = 'test1.txt';
        const filename2 = 'test2.txt';
        const filename3 = 'test3.txt';

        createFile(filename1, content);
        createFile(filename2, content);
        createFile(filename3, content);

        const { payload: payload1, boundary: boundary1 } = createMultipartPayload([filename1]);

        const response1 = await app.inject({
            method: 'POST',
            url: '/upload',
            payload: payload1,
            headers: { 'content-type': `multipart/form-data; boundary=${boundary1}` },
        });
        const result1 = JSON.parse(response1.payload);

        const { payload: payload2, boundary: boundary2 } = createMultipartPayload([filename1, filename2, filename3]);

        const response2 = await app.inject({
            method: 'POST',
            url: '/upload',
            payload: payload2,
            headers: { 'content-type': `multipart/form-data; boundary=${boundary2}` },
        });
        const result2 = JSON.parse(response2.payload);

        assert.strictEqual(response1.statusCode, 200);
        assert.strictEqual(response2.statusCode, 200);
        assert.strictEqual(result1.success, true);
        assert.strictEqual(result2.success, true);

        assert.strictEqual(result1.data.size, content.length);
        assert.strictEqual(result2.data.size, content.length);

        assert.strictEqual(result1.data.hash, sha1(content));
        assert.strictEqual(result2.data.hash, sha1(content));

        const stmt = db.prepare('SELECT * FROM uploads WHERE id IN (?, ?)');
        const records = stmt.all(result1.data.id, result2.data.id);
        assert.strictEqual(records.length, 2);
        assert.strictEqual(records[0].size, content.length);
        assert.strictEqual(records[1].size, content.length);
        assert.strictEqual(records[0].hash, sha1(content));
        assert.strictEqual(records[1].hash, sha1(content));

        unlinkSync(filename1);
        unlinkSync(filename2);
        unlinkSync(filename3);
    });

    test('should handle empty file upload', async () => {
        const content = '';
        const filename = 'empty.txt';
        createFile(filename, content);
        const { payload, boundary } = createMultipartPayload([filename]);

        const response = await app.inject({
            method: 'POST',
            url: '/upload',
            payload,
            headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
        });
        const result = JSON.parse(response.payload);

        assert.strictEqual(response.statusCode, 200);
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.size, 0);
        assert.strictEqual(result.data.hash, sha1(''));

        unlinkSync(filename);
    });

    test('should return error when not multipart request', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/upload',
            payload: 'invalid-data',
            headers: { 'content-type': 'text/plain' },
        });
        const result = JSON.parse(response.payload);

        assert.strictEqual(response.statusCode, 500);
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.message, 'the request is not multipart');
    });

    test('should return error when no file uploaded', async () => {
        const { payload, boundary } = createMultipartPayload([], { text: 'some text data' });

        const response = await app.inject({
            method: 'POST',
            url: '/upload',
            payload,
            headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
        });
        const result = JSON.parse(response.payload);

        assert.strictEqual(response.statusCode, 400);
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.message, 'No file uploaded');
    });
});
