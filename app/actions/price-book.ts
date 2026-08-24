'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function getBusinessId(): Promise<string> {
  const supabase = await createClient();
  const { data: bizIds } = await supabase.rpc('get_my_business_ids');
  const id = bizIds?.[0];
  if (!id) throw new Error('No business found');
  return id;
}

function parseItem(formData: FormData) {
  const name = (formData.get('name') as string ?? '').trim();
  const priceStr = (formData.get('price') as string ?? '').trim();
  const unit = (formData.get('unit') as string ?? '').trim() || null;
  const trade = (formData.get('trade') as string ?? '').trim() || null;
  const description = (formData.get('description') as string ?? '').trim() || null;
  const price = parseFloat(priceStr);
  return { name, price, unit, trade, description };
}

export async function addPriceBookItem(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const businessId = await getBusinessId();
  const { name, price, unit, trade, description } = parseItem(formData);

  if (!name) return { error: 'El nombre es requerido' };
  if (isNaN(price) || price < 0) return { error: 'Precio inválido' };

  const { error } = await supabase.from('price_book_items').insert({
    business_id: businessId,
    name,
    price_cents: Math.round(price * 100),
    unit,
    trade,
    description,
    active: true,
    favorite: false,
  });

  if (error) return { error: error.message };
  revalidatePath('/app');
  revalidatePath('/app/price-book');
  return {};
}

export async function updatePriceBookItem(id: string, prevState: string | null, formData: FormData): Promise<string | null> {
  const supabase = await createClient();
  const { name, price, unit, trade, description } = parseItem(formData);

  if (!name) return 'El nombre es requerido';
  if (isNaN(price) || price < 0) return 'Precio inválido';

  const { error } = await supabase.from('price_book_items').update({
    name,
    price_cents: Math.round(price * 100),
    unit,
    trade,
    description,
  }).eq('id', id);

  if (error) return error.message;
  revalidatePath('/app');
  revalidatePath('/app/price-book');
  redirect('/app/price-book');
}

export async function toggleFavorite(id: string, current: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('price_book_items').update({ favorite: !current }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/app');
  revalidatePath('/app/price-book');
  return {};
}

export async function toggleActive(id: string, current: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('price_book_items').update({ active: !current }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/app');
  revalidatePath('/app/price-book');
  return {};
}

export async function archivePriceBookItem(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('price_book_items')
    .update({ archived_at: new Date().toISOString() }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/app');
  revalidatePath('/app/price-book');
  return {};
}

export async function bulkImportPriceBookItems(items: {
  name: string; price_cents: number; unit: string | null; trade: string | null; description: string | null
}[]): Promise<{ count?: number; error?: string }> {
  const supabase = await createClient();
  const businessId = await getBusinessId();
  if (!items.length) return { count: 0 };

  const rows = items.map(item => ({
    business_id: businessId,
    name: item.name.slice(0, 80),
    price_cents: Math.max(0, Math.round(item.price_cents ?? 0)),
    unit: item.unit ?? null,
    trade: item.trade ?? null,
    description: item.description ?? null,
    active: true,
    favorite: false,
  }));

  const { data, error } = await supabase.from('price_book_items').insert(rows).select('id');
  if (error) return { error: error.message };
  revalidatePath('/app/price-book');
  return { count: data?.length ?? 0 };
}

export async function reactivatePriceBookItem(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('price_book_items')
    .update({ archived_at: null }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/app');
  revalidatePath('/app/price-book');
  return {};
}
