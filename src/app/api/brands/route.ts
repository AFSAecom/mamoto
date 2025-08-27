import { NextResponse } from 'next/server';
import brandsData from '@/data/brands.json';

export async function GET() {
  try {
    return NextResponse.json(brandsData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}