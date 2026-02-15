import { writeFile, mkdir } from 'fs/promises';
import { join, normalize, dirname } from 'path';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { path: inputPath, data } = await request.json();

    if (!inputPath || typeof inputPath !== 'string') {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Sanitize path to prevent directory traversal
    // 1. Remove any .. sequences
    // 2. Remove leading slashes
    // 3. Normalize the path to resolve any remaining path tricks
    const sanitizedPath = normalize(inputPath.replace(/\.\./g, '').replace(/^\/+/, ''));

    // Ensure path ends with .json
    const finalPath = sanitizedPath.endsWith('.json') ? sanitizedPath : `${sanitizedPath}.json`;

    // Ensure path is within the uwu-canvas data directory
    const dataDir = process.env.UWU_DATA_DIR || join(process.cwd(), 'data', 'uwu-canvas');
    const filePath = join(dataDir, finalPath);

    // Verify the normalized path is still within the data directory
    const normalizedFilePath = normalize(filePath);
    if (!normalizedFilePath.startsWith(dataDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Create parent directories if they don't exist
    const parentDir = dirname(normalizedFilePath);
    await mkdir(parentDir, { recursive: true });

    // Write the JSON file
    await writeFile(normalizedFilePath, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({ success: true, path: finalPath });
  } catch (error) {
    console.error('Error writing JSON file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to write JSON file' },
      { status: 500 }
    );
  }
}
