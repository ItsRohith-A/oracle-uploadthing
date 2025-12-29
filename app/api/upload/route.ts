import { NextRequest, NextResponse } from 'next/server';
import { verifyBearerToken, unauthorizedBearerResponse, getProjectFromHeader } from '@/lib/auth';
import { isValidProjectName, generateSafeFilename, getContentType, isAllowedContentType } from '@/lib/validation';
import { uploadFile, projectExists, createProject } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/upload
 * Upload a file to a project
 *
 * Auth: Bearer token
 * Headers:
 *   - Authorization: Bearer <API_TOKEN>
 *   - X-Project-Name: <project-name>
 * Body: multipart/form-data with file
 */
export async function POST(request: NextRequest) {
  // Verify Bearer token
  if (!verifyBearerToken(request)) {
    return unauthorizedBearerResponse();
  }

  // Get project name from header
  const projectName = getProjectFromHeader(request);

  if (!projectName) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'X-Project-Name header is required' },
      { status: 400 }
    );
  }

  if (!isValidProjectName(projectName)) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: 'Invalid project name. Must be lowercase, kebab-case (e.g., my-project)',
      },
      { status: 400 }
    );
  }

  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'No file provided. Use "file" field in multipart form data' },
        { status: 400 }
      );
    }

    // Validate file size (limit to 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
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

    // Check if project exists, create if not
    const exists = await projectExists(projectName);
    if (!exists) {
      await createProject(projectName);
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
        project: projectName,
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
