import type { FastifyInstance } from 'fastify';
import type { DatabaseSync } from 'node:sqlite';
import { saveUpload } from './save-upload.ts';
import { processFileStream } from './process-file-stream.ts';
import multipart from '@fastify/multipart';
import fastify from 'fastify';

export async function buildApp(db: DatabaseSync): Promise<FastifyInstance> {
    const app = fastify({ logger: process.env.NODE_ENV !== 'test', disableRequestLogging: true });

    const sql = db.prepare(`INSERT INTO uploads (size, hash) VALUES (?, ?)`);

    await app.register(multipart, {
        limits: {
            fileSize: Infinity,
            files: 1,
        },
    });

    app.post('/upload', async (request, reply) => {
        try {
            const data = await request.file();

            if (!data?.file) {
                request.log.warn('No file uploaded');
                return reply.status(400).send({
                    success: false,
                    message: 'No file uploaded',
                });
            }

            const { hash, size } = await processFileStream(request, data.file);
            const upload = saveUpload({ request, sql, size, hash });

            return reply.status(200).send({
                success: true,
                data: upload,
            });
        } catch (error) {
            request.log.error(error);

            const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
            return reply.status(500).send({
                success: false,
                message: errorMessage,
            });
        }
    });

    return app;
}
