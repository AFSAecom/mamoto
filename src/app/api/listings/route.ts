import { NextResponse } from 'next/server';
import listingsData from '@/data/listings.json';

export async function GET() {
  try {
    return NextResponse.json(listingsData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}