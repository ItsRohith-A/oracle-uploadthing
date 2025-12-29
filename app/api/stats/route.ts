import { NextResponse } from 'next/server';
import { listProjects, listFiles } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_STORAGE_BYTES = 20 * 1024 * 1024 * 1024; // 20GB

interface ProjectStats {
  name: string;
  fileCount: number;
  totalSize: number;
}

/**
 * GET /api/stats
 * Get storage statistics
 *
 * Auth: Session (handled by middleware)
 */
export async function GET() {
  try {
    const projects = await listProjects();

    let totalStorageUsed = 0;
    const projectStats: ProjectStats[] = [];

    // Get stats for each project
    for (const project of projects) {
      try {
        const files = await listFiles(project.name);
        const projectSize = files.reduce((sum, file) => sum + (file.size || 0), 0);

        projectStats.push({
          name: project.name,
          fileCount: files.length,
          totalSize: projectSize,
        });

        totalStorageUsed += projectSize;
      } catch (error) {
        console.error(`Error getting stats for project ${project.name}:`, error);
        projectStats.push({
          name: project.name,
          fileCount: 0,
          totalSize: 0,
        });
      }
    }

    // Sort by size descending
    projectStats.sort((a, b) => b.totalSize - a.totalSize);

    return NextResponse.json({
      success: true,
      storage: {
        used: totalStorageUsed,
        total: MAX_STORAGE_BYTES,
        available: MAX_STORAGE_BYTES - totalStorageUsed,
        usedPercentage: (totalStorageUsed / MAX_STORAGE_BYTES) * 100,
      },
      projects: projectStats,
      totalProjects: projects.length,
      totalFiles: projectStats.reduce((sum, p) => sum + p.fileCount, 0),
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to get stats' },
      { status: 500 }
    );
  }
}
