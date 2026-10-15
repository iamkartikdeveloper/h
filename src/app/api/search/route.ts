import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';
  const category = searchParams.get('category')?.trim() || '';
  const tag = searchParams.get('tag')?.trim() || '';
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  const supabase = createServerClient();

  try {
    let query = supabase
      .from('tutorials')
      .select(`
        id,
        title,
        slug,
        description,
        difficulty,
        reading_time,
        thumbnail_url,
        youtube_url,
        is_featured,
        published_at,
        category:categories(id, name, slug)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (q) {
      // Search title, description, and content with case-insensitive ilike
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,content.ilike.%${q}%`);
    }

    if (category) {
      // Find category by slug
      const { data: catData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single();

      if (catData?.id) {
        query = query.eq('category_id', catData.id);
      }
    }

    const { data: tutorials, error } = await query;

    if (error) {
      console.warn('Search query notice:', error.message);
      return NextResponse.json({ tutorials: [], notice: error.message }, { status: 200 });
    }

    return NextResponse.json({ tutorials: tutorials || [] });
  } catch (err: any) {
    console.warn('Internal search error:', err.message);
    return NextResponse.json({ tutorials: [], notice: err.message }, { status: 200 });
  }
}
