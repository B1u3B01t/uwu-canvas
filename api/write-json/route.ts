import { writeFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { path, data } = await request.json();

    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Sanitize path to prevent directory traversal
    const sanitizedPath = path.replace(/\.\./g, '').replace(/^\//, '');
    
    // Ensure path is within /app/data directory
    const filePath = join(process.cwd(), 'app', 'data', sanitizedPath);

    // Verify the path is within the data directory
    const dataDir = join(process.cwd(), 'app', 'data');
    if (!filePath.startsWith(dataDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Write the JSON file
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({ success: true, path: sanitizedPath });
  } catch (error) {
    console.error('Error writing JSON file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to write JSON file' },
      { status: 500 }
    );
  }
}
