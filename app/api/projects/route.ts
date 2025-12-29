import { NextRequest, NextResponse } from 'next/server';
import { isValidProjectName } from '@/lib/validation';
import { listProjects, createProject, projectExists } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/projects
 * List all projects
 *
 * Auth: Basic (handled by middleware)
 */
export async function GET() {
  try {
    const projects = await listProjects();

    return NextResponse.json({
      success: true,
      projects: projects.map((p) => ({
        name: p.name,
      })),
    });
  } catch (error) {
    console.error('List projects error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to list projects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 *
 * Auth: Basic (handled by middleware)
 * Body: { name: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Project name is required' },
        { status: 400 }
      );
    }

    const projectName = name.trim().toLowerCase();

    if (!isValidProjectName(projectName)) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message:
            'Invalid project name. Must be lowercase, kebab-case, 1-63 characters (e.g., my-project)',
        },
        { status: 400 }
      );
    }

    // Check if project already exists
    const exists = await projectExists(projectName);
    if (exists) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Project already exists' },
        { status: 409 }
      );
    }

    // Create project
    await createProject(projectName);

    return NextResponse.json(
      {
        success: true,
        project: {
          name: projectName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to create project' },
      { status: 500 }
    );
  }
}
