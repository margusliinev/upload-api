import type { MultipartFile } from '@fastify/multipart';
import type { FastifyRequest } from 'fastify';
import { createHash } from 'crypto';

export async function processFileStream(request: FastifyRequest, fileStream: MultipartFile['file']) {
    try {
        const hash = createHash('sha1');
        let totalSize = 0;

        for await (const chunk of fileStream) {
            hash.update(chunk);
            totalSize += chunk.length;
        }

        return {
            hash: hash.digest('hex'),
            size: totalSize,
        };
    } catch (error) {
        request.log.error(error);
        throw new Error('Failed to process file stream');
    }
}
