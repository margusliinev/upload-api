import type { FastifyRequest } from 'fastify';
import type { StatementSync } from 'node:sqlite';

type SaveUploadParams = {
    request: FastifyRequest;
    sql: StatementSync;
    size: number;
    hash: string;
};

function saveUpload({ request, sql, size, hash }: SaveUploadParams) {
    try {
        const result = sql.run(size, hash);
        return {
            id: result.lastInsertRowid,
            size,
            hash,
        };
    } catch (error) {
        request.log.error(error);
        throw new Error('Failed to save upload data to the database');
    }
}

export { saveUpload };
