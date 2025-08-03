# Upload API

File upload API with Fastify that processes unlimited file sizes and stores metadata in SQLite.

## Requirements

-   Node.js 24+ (built-in TypeScript support)

## Quick Start

```bash
# Install Dependencies
npm install

# Development
npm run dev

# Production
npm run build && npm run start
```

## API

**POST /upload** - Upload file and get metadata

```bash
curl -F "file=@yourfile.txt" http://localhost:3000/upload
```

Response:

```json
{
    "success": true,
    "data": {
        "id": 1,
        "size": 1024,
        "hash": "da39a3ee5e6b4b0d3255bfef95601890afd80709"
    }
}
```

## Testing

```bash
# Unit tests
npm run test

# Navigate to project root
cd upload-api

# Create 100GB test file
dd if=/dev/zero of=file-100gb.dat bs=1M count=102400

# Test with 100GB file - monitor memory usage during upload
# Open Activity Monitor (macOS), Task Manager (Windows), or HTOP (Linux)
# Monitor NodeJS memory usage remains stable (~50-100MB) even with large files
npm run dev
curl -F "file=@file-100gb.dat" http://localhost:3000/upload
```
