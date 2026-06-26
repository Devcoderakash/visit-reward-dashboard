import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { owner_id, name, whatsapp, description, category, address, opening_hours, instagram, website } = body;

    if (!owner_id || !name) {
      return NextResponse.json({ error: 'Missing owner_id or name' }, { status: 400 });
    }

    // 1. Insert into users with role = shop_owner
    await supabaseAdmin.from('users').upsert({
      id: owner_id,
      name: name + ' Owner',
      mobile: whatsapp || 'N/A',
      role: 'shop_owner'
    });

    // 2. Generate qr_code_id
    const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'SHP');
    let code = prefix + Math.floor(100 + Math.random() * 900);
    let isUnique = false;
    while (!isUnique) {
      const { data } = await supabaseAdmin.from('shops').select('id').eq('qr_code_id', code).single();
      if (!data) isUnique = true;
      else code = prefix + Math.floor(100 + Math.random() * 900);
    }

    // 3. Insert into shops table
    const { error: shopError } = await supabaseAdmin.from('shops').insert({
      owner_id,
      name,
      description,
      category,
      address,
      opening_hours,
      instagram,
      whatsapp,
      website,
      qr_code_id: code,
      visits_required: 5
    });

    if (shopError) throw shopError;

    return NextResponse.json({ success: true, qr_code_id: code });

  } catch (error: any) {
    console.error('Error in /api/register-shop:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
