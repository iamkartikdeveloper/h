import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { tutorialId } = await request.json();
    if (!tutorialId) {
      return NextResponse.json({ error: 'tutorialId is required' }, { status: 400 });
    }

    const supabase = createServerClient();
    await supabase.from('tutorial_views').insert([{ tutorial_id: tutorialId }]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Non-blocking view tracker
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
