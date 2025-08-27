import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import versionsData from '@/data/versions.json';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const model = searchParams.get('model');

    if (model) {
      const filteredVersions = versionsData.filter(version => version.modelId === model);
      return NextResponse.json(filteredVersions);
    }

    return NextResponse.json(versionsData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}