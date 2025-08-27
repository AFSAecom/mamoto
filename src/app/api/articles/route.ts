import { NextResponse } from 'next/server';
import articlesData from '@/data/articles.json';

export async function GET() {
  try {
    return NextResponse.json(articlesData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}