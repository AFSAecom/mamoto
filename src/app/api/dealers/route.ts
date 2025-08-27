import { NextResponse } from 'next/server';
import dealersData from '@/data/dealers.json';

export async function GET() {
  try {
    return NextResponse.json(dealersData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch dealers' },
      { status: 500 }
    );
  }
}