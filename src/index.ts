import { DatabaseSync } from 'node:sqlite';
import { buildApp } from './app.ts';

const db = new DatabaseSync('./uploads.db');

const start = async () => {
    try {
        db.exec(`
            CREATE TABLE IF NOT EXISTS uploads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                size INTEGER NOT NULL,
                hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        const app = await buildApp(db);
        await app.listen({ port: 3000, host: '127.0.0.1' });
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

start();
