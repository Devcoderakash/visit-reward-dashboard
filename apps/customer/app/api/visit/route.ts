export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';

export async function POST(request: Request) {
  try {
    const { shop_qr_id, customer_id } = await request.json();

    if (!shop_qr_id || !customer_id) {
      return NextResponse.json({ error: 'Missing shop_qr_id or customer_id' }, { status: 400 });
    }

    // 1. Find shop by qr_code_id
    const { data: shop, error: shopError } = await supabaseAdmin
      .from('shops')
      .select('id, name, visits_required')
      .eq('qr_code_id', shop_qr_id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // 2. Find or create customer_shop record
    let { data: customerShop, error: csError } = await supabaseAdmin
      .from('customer_shop')
      .select('*')
      .eq('customer_id', customer_id)
      .eq('shop_id', shop.id)
      .single();

    if (!customerShop && csError?.code === 'PGRST116') {
      // Not found, create it
      const { data: newCs, error: insertError } = await supabaseAdmin
        .from('customer_shop')
        .insert({ customer_id, shop_id: shop.id, total_visits: 0, streak_count: 0 })
        .select()
        .single();
      
      if (insertError) throw insertError;
      customerShop = newCs;
    } else if (csError) {
      throw csError;
    }

    // 3. Date checks
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (customerShop.last_visit_date === todayStr) {
      return NextResponse.json({
        status: 'already_visited',
        visits: customerShop.total_visits,
        shop: { id: shop.id, name: shop.name }
      });
    }

    // Calculate streak
    let newStreak = 1;
    if (customerShop.last_visit_date) {
      const lastVisit = new Date(customerShop.last_visit_date);
      const today = new Date(todayStr);
      const diffTime = Math.abs(today.getTime() - lastVisit.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newStreak = customerShop.streak_count + 1;
      }
    }

    const newTotalVisits = customerShop.total_visits + 1;

    // Update customer_shop
    await supabaseAdmin
      .from('customer_shop')
      .update({
        total_visits: newTotalVisits,
        last_visit_date: todayStr,
        streak_count: newStreak
      })
      .eq('id', customerShop.id);

    // Check for reward unlock
    if (newTotalVisits % shop.visits_required === 0) {
      // Generate unique code
      const generateCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();
      let code = generateCode();
      let codeIsUnique = false;
      
      while (!codeIsUnique) {
        const { data: existing } = await supabaseAdmin
          .from('scratch_cards')
          .select('id')
          .eq('redemption_code', code)
          .single();
        if (!existing) {
          codeIsUnique = true;
        } else {
          code = generateCode();
        }
      }

      // Determine reward
      let rewardText = '';
      if (newStreak >= 5) {
        rewardText = 'Premium Combo — Streak Bonus!';
      } else {
        const pool = ["Free Item", "10% OFF", "Free Dessert", "20% OFF", "Free Drink"];
        rewardText = pool[Math.floor(Math.random() * pool.length)];
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Insert scratch card
      const { data: scratchCard, error: scError } = await supabaseAdmin
        .from('scratch_cards')
        .insert({
          customer_id,
          shop_id: shop.id,
          reward_text: rewardText,
          redemption_code: code,
          expires_at: expiresAt.toISOString()
        })
        .select('id')
        .single();

      if (scError) throw scError;

      return NextResponse.json({
        status: 'scratch_card_unlocked',
        scratch_card_id: scratchCard.id,
        visits: newTotalVisits,
        shop: { id: shop.id, name: shop.name }
      });
    }

    // Regular visit
    if (newTotalVisits === 1) {
      return NextResponse.json({
        status: 'first_visit',
        visits: 1,
        shop: { id: shop.id, name: shop.name }
      });
    } else {
      return NextResponse.json({
        status: 'visit_recorded',
        visits: newTotalVisits,
        shop: { id: shop.id, name: shop.name }
      });
    }

  } catch (error: any) {
    console.error('Error in /api/visit:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
