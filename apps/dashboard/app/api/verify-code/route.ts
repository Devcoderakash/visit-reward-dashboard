import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';

export async function POST(request: Request) {
  try {
    const { redemption_code, shop_id } = await request.json();

    if (!redemption_code || !shop_id) {
      return NextResponse.json({ error: 'Missing redemption_code or shop_id' }, { status: 400 });
    }

    const { data: card, error } = await supabaseAdmin
      .from('scratch_cards')
      .select('id, is_redeemed, expires_at, reward_text, customer_id')
      .eq('redemption_code', redemption_code)
      .eq('shop_id', shop_id)
      .single();

    if (error || !card) {
      return NextResponse.json({ valid: false, reason: 'not_found' });
    }

    if (card.is_redeemed) {
      return NextResponse.json({ valid: false, reason: 'already_redeemed' });
    }

    if (new Date(card.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, reason: 'expired' });
    }

    // Mark as redeemed
    await supabaseAdmin
      .from('scratch_cards')
      .update({ is_redeemed: true })
      .eq('id', card.id);

    // Fetch customer name
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', card.customer_id)
      .single();

    return NextResponse.json({
      valid: true,
      customer_name: user?.name || 'Customer',
      reward_text: card.reward_text
    });

  } catch (error: any) {
    console.error('Error in /api/verify-code:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
