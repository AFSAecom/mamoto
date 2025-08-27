import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import modelsData from '@/data/models.json';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');

    if (brand) {
      const filteredModels = modelsData.filter(model => model.brandId === brand);
      return NextResponse.json(filteredModels);
    }

    return NextResponse.json(modelsData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}