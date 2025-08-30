import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { version_ids } = body;

    if (!version_ids || !Array.isArray(version_ids)) {
      return NextResponse.json(
        { error: 'version_ids array is required' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const s = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    // Get versions to compare
    const { data: versions, error: versionsError } = await s
      .from('versions')
      .select('*')
      .in('id', version_ids);
    if (versionsError) throw versionsError;

    if (!versions || versions.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 versions required for comparison' },
        { status: 400 }
      );
    }

    // Generate similarities and differences
    const similarities: Record<string, any> = {};
    const differences: Record<string, any> = {};

    // Engine comparison
    const engineSimilarities = [];
    const engineDifferences = [];

    // Check engine type similarity
    const engineTypes = [...new Set(versions.map(v => v.engine.type))];
    if (engineTypes.length === 1) {
      engineSimilarities.push(`Toutes les motos ont un moteur ${engineTypes[0]}`);
    } else {
      engineDifferences.push({
        feature: 'Type de moteur',
        values: versions.map(v => ({ version: v.name, value: v.engine.type }))
      });
    }

    // Engine displacement
    engineDifferences.push({
      feature: 'Cylindrée (cc)',
      values: versions.map(v => ({ version: v.name, value: v.engine.displacement }))
    });

    // Power
    engineDifferences.push({
      feature: 'Puissance (ch)',
      values: versions.map(v => ({ version: v.name, value: v.engine.power }))
    });

    similarities.engine = engineSimilarities;
    differences.engine = engineDifferences;

    // Performance comparison
    const performanceDifferences = [
      {
        feature: 'Vitesse max (km/h)',
        values: versions.map(v => ({ version: v.name, value: v.performance.topSpeed }))
      },
      {
        feature: '0-100 km/h (s)',
        values: versions.map(v => ({ version: v.name, value: v.performance.acceleration }))
      },
      {
        feature: 'Poids (kg)',
        values: versions.map(v => ({ version: v.name, value: v.performance.weight }))
      }
    ];

    similarities.performance = [];
    differences.performance = performanceDifferences;

    // Dimensions comparison
    const dimensionsDifferences = [
      {
        feature: 'Longueur (mm)',
        values: versions.map(v => ({ version: v.name, value: v.dimensions.length }))
      },
      {
        feature: 'Largeur (mm)',
        values: versions.map(v => ({ version: v.name, value: v.dimensions.width }))
      },
      {
        feature: 'Hauteur (mm)',
        values: versions.map(v => ({ version: v.name, value: v.dimensions.height }))
      },
      {
        feature: 'Empattement (mm)',
        values: versions.map(v => ({ version: v.name, value: v.dimensions.wheelbase }))
      }
    ];

    similarities.dimensions = [];
    differences.dimensions = dimensionsDifferences;

    // Safety features comparison
    const safetySimilarities = [];
    const safetyDifferences = [];

    // ABS
    const absValues = [...new Set(versions.map(v => v.features.abs))];
    if (absValues.length === 1) {
      safetySimilarities.push(`Toutes les motos ${absValues[0] ? 'ont' : "n'ont pas"} l'ABS`);
    } else {
      safetyDifferences.push({
        feature: 'ABS',
        values: versions.map(v => ({ version: v.name, value: v.features.abs ? 'Oui' : 'Non' }))
      });
    }

    // TCS
    const tcsValues = [...new Set(versions.map(v => v.features.tcs))];
    if (tcsValues.length === 1) {
      safetySimilarities.push(`Toutes les motos ${tcsValues[0] ? 'ont' : "n'ont pas"} le contrôle de traction`);
    } else {
      safetyDifferences.push({
        feature: 'Contrôle de traction',
        values: versions.map(v => ({ version: v.name, value: v.features.tcs ? 'Oui' : 'Non' }))
      });
    }

    similarities.safety = safetySimilarities;
    differences.safety = safetyDifferences;

    // Comfort features comparison
    const comfortSimilarities = [];
    const comfortDifferences = [];

    // Quickshifter
    const quickshifterValues = [...new Set(versions.map(v => v.features.quickshifter))];
    if (quickshifterValues.length === 1) {
      comfortSimilarities.push(`Toutes les motos ${quickshifterValues[0] ? 'ont' : "n'ont pas"} le quickshifter`);
    } else {
      comfortDifferences.push({
        feature: 'Quickshifter',
        values: versions.map(v => ({ version: v.name, value: v.features.quickshifter ? 'Oui' : 'Non' }))
      });
    }

    // Cruise Control
    const cruiseValues = [...new Set(versions.map(v => v.features.cruiseControl))];
    if (cruiseValues.length === 1) {
      comfortSimilarities.push(`Toutes les motos ${cruiseValues[0] ? 'ont' : "n'ont pas"} le régulateur de vitesse`);
    } else {
      comfortDifferences.push({
        feature: 'Régulateur de vitesse',
        values: versions.map(v => ({ version: v.name, value: v.features.cruiseControl ? 'Oui' : 'Non' }))
      });
    }

    // LED Lights
    const ledValues = [...new Set(versions.map(v => v.features.ledLights))];
    if (ledValues.length === 1) {
      comfortSimilarities.push(`Toutes les motos ${ledValues[0] ? 'ont' : "n'ont pas"} les éclairages LED`);
    } else {
      comfortDifferences.push({
        feature: 'Éclairage LED',
        values: versions.map(v => ({ version: v.name, value: v.features.ledLights ? 'Oui' : 'Non' }))
      });
    }

    similarities.comfort = comfortSimilarities;
    differences.comfort = comfortDifferences;

    // Price comparison
    differences.price = [{
      feature: 'Prix (TND)',
      values: versions.map(v => ({ version: v.name, value: v.price }))
    }];

    return NextResponse.json({
      versions: versions,
      similarities: similarities,
      differences: differences
    });

  } catch (error) {
    console.error('Comparator API error:', error);
    return NextResponse.json(
      { error: 'Failed to compare versions' },
      { status: 500 }
    );
  }
}
