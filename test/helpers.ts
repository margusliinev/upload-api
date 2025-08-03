import { writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'crypto';

export function createFile(name: string, content: string): void {
    writeFileSync(name, content);
}

export function sha1(content: string): string {
    return createHash('sha1').update(content).digest('hex');
}

export function createMultipartPayload(files: string[] = [], textFields: Record<string, string> = {}) {
    const boundary = `----test-${Date.now()}`;
    const parts: string[] = [];

    Object.entries(textFields).forEach(([name, value]) => {
        parts.push(`--${boundary}`, `Content-Disposition: form-data; name="${name}"`, '', value);
    });

    files.forEach((filename, index) => {
        const file = readFileSync(filename);
        const fieldName = `file${index + 1}`;
        parts.push(`--${boundary}`, `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"`, `Content-Type: application/octet-stream`, '', file.toString('binary'));
    });

    parts.push(`--${boundary}--`, '');

    return {
        payload: Buffer.from(parts.join('\r\n'), 'binary'),
        boundary,
    };
}
