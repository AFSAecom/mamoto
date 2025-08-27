import { NextResponse } from 'next/server';
import guidesData from '@/data/guides.json';

export async function GET() {
  try {
    return NextResponse.json(guidesData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch guides' },
      { status: 500 }
    );
  }
}