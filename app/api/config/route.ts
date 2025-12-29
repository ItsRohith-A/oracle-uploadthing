import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/config
 * Get API configuration (API key for uploads)
 *
 * Auth: Session (handled by middleware)
 */
export async function GET() {
  try {
    const apiToken = process.env.API_TOKEN;

    if (!apiToken) {
      return NextResponse.json(
        { error: 'API token not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      apiKey: apiToken,
    });
  } catch (error) {
    console.error('Config error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
