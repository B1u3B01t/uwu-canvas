import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { NextResponse } from 'next/server';

async function findJsonFiles(dir: string, baseDir: string, fileList: string[] = []): Promise<string[]> {
  const files = await readdir(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const fileStat = await stat(filePath);

    if (fileStat.isDirectory()) {
      await findJsonFiles(filePath, baseDir, fileList);
    } else if (file.endsWith('.json')) {
      // Get relative path from baseDir
      const relativePath = filePath.replace(baseDir + '/', '').replace(/\\/g, '/');
      fileList.push(relativePath);
    }
  }

  return fileList;
}

export async function GET() {
  try {
    const dataDir = process.env.UWU_DATA_DIR || join(process.cwd(), 'data', 'uwu-canvas');
    if (!existsSync(dataDir)) {
      return NextResponse.json({ files: [] });
    }
    const jsonFiles = await findJsonFiles(dataDir, dataDir);

    // Sort files alphabetically
    jsonFiles.sort();

    return NextResponse.json({ files: jsonFiles });
  } catch (error) {
    console.error('Error listing JSON files:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list JSON files' },
      { status: 500 }
    );
  }
}
