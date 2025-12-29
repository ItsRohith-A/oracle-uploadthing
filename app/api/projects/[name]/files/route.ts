import { NextRequest, NextResponse } from 'next/server';
import { isValidProjectName, generateSafeFilename, getContentType, isAllowedContentType } from '@/lib/validation';
import { listFiles, uploadFile, projectExists, createProject } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    name: string;
  };
}

/**
 * GET /api/projects/[name]/files
 * List all files in a project
 *
 * Auth: Basic (handled by middleware)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const projectName = context.params.name;

  if (!isValidProjectName(projectName)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid project name' },
      { status: 400 }
    );
  }

  try {
    // Check if project exists
    const exists = await projectExists(projectName);
    if (!exists) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Project not found' },
        { status: 404 }
      );
    }

    const files = await listFiles(projectName);

    return NextResponse.json({
      success: true,
      project: projectName,
      files: files.map((f) => ({
        name: f.name,
        size: f.size,
        lastModified: f.lastModified.toISOString(),
        publicUrl: f.publicUrl,
      })),
    });
  } catch (error) {
    console.error('List files error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to list files' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[name]/files
 * Upload a file to a project (UI upload)
 *
 * Auth: Basic (handled by middleware)
 * Body: multipart/form-data with file
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const projectName = context.params.name;

  if (!isValidProjectName(projectName)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid project name' },
      { status: 400 }
    );
  }

  try {
    // Check if project exists, create if not
    const exists = await projectExists(projectName);
    if (!exists) {
      await createProject(projectName);
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (limit to 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'File too large. Maximum size is 100MB' },
        { status: 400 }
      );
    }

    // Get content type
    const contentType = file.type || getContentType(file.name);

    // Validate content type
    if (!isAllowedContentType(contentType)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Generate safe filename with UUID
    const safeFilename = generateSafeFilename(file.name);

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file
    const fileInfo = await uploadFile(projectName, safeFilename, buffer, contentType);

    return NextResponse.json({
      success: true,
      file: {
        name: fileInfo.name,
        originalName: file.name,
        size: fileInfo.size,
        contentType: contentType,
        publicUrl: fileInfo.publicUrl,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
