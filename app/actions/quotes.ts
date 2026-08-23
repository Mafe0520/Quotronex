'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface SaveQuoteInput {
  trade: string;
  serviceName: string;
  priceTotal: number; // in dollars
  description: string;
}

export async function saveQuoteAndRedirect(input: SaveQuoteInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Not authenticated → go to paywall (quote will be re-created post-signup)
  if (!user) {
    redirect('/paywall');
  }

  const { data: bizIds } = await supabase.rpc('get_my_business_ids');
  const businessId = bizIds?.[0];

  if (!businessId) {
    // No business yet — go to paywall, bootstrap will create it on signup
    redirect('/paywall');
  }

  const totalCents = Math.round(input.priceTotal * 100);
  const laborCents = Math.round(totalCents * 0.65);
  const materialsCents = Math.round(totalCents * 0.30);
  const miscCents = totalCents - laborCents - materialsCents;

  // Upsert price book item (find by name+business or create)
  let pbItemId: string | null = null;
  const { data: existing } = await supabase
    .from('price_book_items')
    .select('id')
    .eq('business_id', businessId)
    .ilike('name', input.serviceName)
    .limit(1)
    .single();

  if (existing) {
    pbItemId = existing.id;
  } else {
    const { data: newItem } = await supabase
      .from('price_book_items')
      .insert({
        business_id: businessId,
        name: input.serviceName,
        price_cents: totalCents,
        trade: input.trade,
        unit: 'job',
        active: true,
      })
      .select('id')
      .single();
    pbItemId = newItem?.id ?? null;
  }

  // Create quote
  const { data: quote, error: quoteErr } = await supabase
    .from('quotes')
    .insert({
      business_id: businessId,
      status: 'draft',
      total_cents: totalCents,
      voice_transcript: input.description,
    })
    .select('id')
    .single();

  if (quoteErr || !quote) {
    // Fail gracefully — still go to paywall
    redirect('/paywall');
  }

  // Create quote items
  const items = [
    { name: 'Labor', unit_price_cents: laborCents, qty: 1, total_cents: laborCents, sort_order: 1 },
    { name: 'Materials', unit_price_cents: materialsCents, qty: 1, total_cents: materialsCents, sort_order: 2 },
    ...(miscCents > 0 ? [{ name: 'Miscellaneous', unit_price_cents: miscCents, qty: 1, total_cents: miscCents, sort_order: 3 }] : []),
  ];

  await supabase.from('quote_items').insert(
    items.map(it => ({
      ...it,
      quote_id: quote.id,
      business_id: businessId,
      price_book_item_id: it.sort_order === 1 ? pbItemId : null,
      description: it.sort_order === 1 ? input.description : null,
      unit: 'job',
    }))
  );

  // Log estimate event
  await supabase.from('estimate_events').insert({
    quote_id: quote.id,
    business_id: businessId,
    event_type: 'created',
    actor_id: user.id,
  });

  // Check subscription status
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('business_id', businessId)
    .single();

  const hasAccess = sub && ['trialing', 'active'].includes(sub.status);

  if (hasAccess) {
    redirect('/app');
  } else {
    redirect('/paywall');
  }
}
