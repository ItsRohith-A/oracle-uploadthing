import { NextRequest, NextResponse } from 'next/server';
import { isValidProjectName } from '@/lib/validation';
import { deleteFile, getFileInfo } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    name: string;
    fileName: string;
  };
}

/**
 * DELETE /api/projects/[name]/files/[fileName]
 * Delete a file from a project
 *
 * Auth: Basic (handled by middleware)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const projectName = context.params.name;
  const fileName = context.params.fileName;

  if (!isValidProjectName(projectName)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid project name' },
      { status: 400 }
    );
  }

  if (!fileName) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'File name is required' },
      { status: 400 }
    );
  }

  // Decode the filename (it may be URL encoded)
  const decodedFileName = decodeURIComponent(fileName);

  try {
    // Check if file exists
    const fileInfo = await getFileInfo(projectName, decodedFileName);
    if (!fileInfo) {
      return NextResponse.json(
        { error: 'Not Found', message: 'File not found' },
        { status: 404 }
      );
    }

    // Delete the file
    await deleteFile(projectName, decodedFileName);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
      file: {
        name: decodedFileName,
        project: projectName,
      },
    });
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to delete file' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/projects/[name]/files/[fileName]
 * Get file info
 *
 * Auth: Basic (handled by middleware)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const projectName = context.params.name;
  const fileName = context.params.fileName;

  if (!isValidProjectName(projectName)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid project name' },
      { status: 400 }
    );
  }

  if (!fileName) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'File name is required' },
      { status: 400 }
    );
  }

  // Decode the filename
  const decodedFileName = decodeURIComponent(fileName);

  try {
    const fileInfo = await getFileInfo(projectName, decodedFileName);

    if (!fileInfo) {
      return NextResponse.json(
        { error: 'Not Found', message: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      file: {
        name: fileInfo.name,
        size: fileInfo.size,
        contentType: fileInfo.contentType,
        lastModified: fileInfo.lastModified.toISOString(),
        publicUrl: fileInfo.publicUrl,
      },
    });
  } catch (error) {
    console.error('Get file info error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to get file info' },
      { status: 500 }
    );
  }
}
