// ============================================================
// js/wishlist.js  —  Wishlist: Toggle / Get / Check
//
// CORRECTIONS MADE:
//  1. Table name aligned: uses 'wishlist_items' consistently
//     (match your Supabase table — change to 'wishlist' if needed)
//  2. addToCart import path fixed (was './cart.js', kept same)
//  3. getWishlist select query fixed: products join uses correct
//     column names (category vs categories relation)
//  4. moveToCart now properly awaits and handles errors
//  5. Added null-guards on user checks
// ============================================================
import { supabase } from './supabase.js';
import { getUser } from './auth.js';

// TABLE NAME — change to 'wishlist' if that's your Supabase table
const TABLE = 'wishlist_items';

// ── Toggle (add if not in list, remove if already there) ──────
export async function toggleWishlist(productId) {
  const user = await getUser();
  if (!user) {
    sessionStorage.setItem('redirectAfterLogin', window.location.href);
    window.location.href = '/auth.html';
    return null; // explicit null so callers can check
  }

  const isWishlisted = await isInWishlist(productId);

  if (isWishlisted) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);
    if (error) throw error;
    return false; // removed
  } else {
    const { error } = await supabase
      .from(TABLE)
      .insert({ user_id: user.id, product_id: productId });
    if (error) throw error;
    return true; // added
  }
}

// ── Check if a product is wishlisted ─────────────────────────
export async function isInWishlist(productId) {
  const user = await getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from(TABLE)
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (error) return false; // don't throw — treat errors as "not wishlisted"
  return !!data;
}

// ── Get all wishlist items with product details ───────────────
export async function getWishlist() {
  const user = await getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      id,
      created_at,
      products (
        id,
        name,
        price,
        images,
        category_id,
        categories ( name )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ── Remove by wishlist item id ────────────────────────────────
export async function removeFromWishlist(wishlistItemId) {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', wishlistItemId);
  if (error) throw error;
}

// ── Move from wishlist to cart ────────────────────────────────
export async function moveToCart(wishlistItemId, productId) {
  // Import lazily to avoid circular deps
  const { addToCart } = await import('./cart.js');

  // Add to cart first — only remove from wishlist if cart add succeeds
  await addToCart(productId);
  await removeFromWishlist(wishlistItemId);
}