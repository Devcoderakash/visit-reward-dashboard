export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';

export async function POST(request: Request) {
  try {
    const { customer_id, shop_id, star_rating, feedback_text } = await request.json();

    if (!customer_id || !shop_id || !star_rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Insert row into private_feedback
    const { error: insertError } = await supabaseAdmin
      .from('private_feedback')
      .insert({
        customer_id,
        shop_id,
        star_rating,
        feedback_text: feedback_text || ''
      });

    if (insertError) throw insertError;

    // 2. Update customer_shop
    const { error: updateError } = await supabaseAdmin
      .from('customer_shop')
      .update({ review_submitted: true })
      .eq('customer_id', customer_id)
      .eq('shop_id', shop_id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in /api/submit-feedback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
