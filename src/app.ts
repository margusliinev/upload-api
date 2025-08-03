import type { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import fastify from 'fastify';

export async function buildApp(): Promise<FastifyInstance> {
    const app = fastify({ logger: process.env.NODE_ENV !== 'test' });

    await app.register(multipart, {
        limits: {
            fileSize: Infinity,
            files: 1,
        },
    });

    app.post('/upload', async (_request, reply) => {
        return reply.status(200).send({
            success: true,
            message: 'File uploaded successfully',
        });
    });

    return app;
}
