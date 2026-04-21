import { NextRequest, NextResponse } from 'next/server';
import { optimize } from 'svgo';

export async function POST(req: NextRequest) {
  try {
    const { svg, options } = await req.json();

    if (!svg) {
      return NextResponse.json({ error: 'SVG code is required' }, { status: 400 });
    }

    const result = optimize(svg, {
      multipass: true,
      plugins: [
        'preset-default',
        'removeDimensions',
        'removeOffCanvasPaths',
        'sortAttrs',
        ...(options?.plugins || []),
      ],
    });

    return NextResponse.json({
      data: result.data,
      stats: {
        originalSize: svg.length,
        optimizedSize: result.data.length,
        saved: svg.length - result.data.length,
        percent: Math.round(((svg.length - result.data.length) / svg.length) * 100),
      },
    });
  } catch (error: any) {
    console.error('SVG Optimization Error:', error);
    return NextResponse.json({ error: 'Failed to optimize SVG' }, { status: 500 });
  }
}
