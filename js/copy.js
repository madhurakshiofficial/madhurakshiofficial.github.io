// ============================================================
// js/cart.js  —  Cart: Add / Remove / Update / Get
// WHERE TO ADD:
//   - product-detail.html: import addToCart, call on "Add to Cart" click
//   - cart.html: import all, render cart on load
//   - header: import getCartCount to show badge
// ============================================================
import { supabase } from './supabase.js';
import { getUser } from './auth.js';

// ── Add to Cart ───────────────────────────────────────────────
export async function addToCart(productId, quantity = 1, size = null, color = null) {
  const user = await getUser();
  if (!user) {
    sessionStorage.setItem('redirectAfterLogin', window.location.href);
    window.location.href = '/auth.html';
    return;
  }

  // Check if same product+size+color already in cart → increment qty
  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .eq('size', size || '')
    .eq('color', color || '')
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('cart_items')
      .insert({ user_id: user.id, product_id: productId, quantity, size, color });
    if (error) throw error;
  }

  updateCartBadge();
  return true;
}

// ── Remove from Cart ──────────────────────────────────────────
export async function removeFromCart(cartItemId) {
  const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);
  if (error) throw error;
  updateCartBadge();
}

// ── Update Quantity ───────────────────────────────────────────
export async function updateCartQty(cartItemId, newQty) {
  if (newQty < 1) return removeFromCart(cartItemId);
  const { error } = await supabase
    .from('cart_items')
    .update({ quantity: newQty })
    .eq('id', cartItemId);
  if (error) throw error;
}

// ── Get Full Cart (with product details) ──────────────────────
export async function getCart() {
  const user = await getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      id, quantity, size, color, created_at,
      products ( id, name, price, images )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ── Get Cart Item Count ───────────────────────────────────────
export async function getCartCount() {
  const user = await getUser();
  if (!user) return 0;
  const { count } = await supabase
    .from('cart_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  return count || 0;
}

// ── Clear entire cart (after order placed) ────────────────────
export async function clearCart() {
  const user = await getUser();
  if (!user) return;
  await supabase.from('cart_items').delete().eq('user_id', user.id);
  updateCartBadge();
}

// ── Cart total ────────────────────────────────────────────────
export function calcCartTotal(cartItems) {
  return cartItems.reduce((sum, item) => {
    return sum + parseFloat(item.products.price) * item.quantity;
  }, 0);
}

// ── Update cart badge in header ───────────────────────────────
export async function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const count = await getCartCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}