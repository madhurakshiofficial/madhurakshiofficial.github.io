// ============================================================
// js/razorpay.js  —  Payment Gateway + Save Order to Supabase
// WHERE TO ADD: checkout.html
// SETUP: Add this script to checkout.html <head>:
//   <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
// Get your Razorpay Key ID from https://dashboard.razorpay.com
// ============================================================
import { supabase } from './supabase.js';
import { getUser } from './auth.js';
import { getCart, calcCartTotal, clearCart } from './cart.js';

const RAZORPAY_KEY_ID = 'YOUR_RAZORPAY_KEY_ID'; // 🔑 Replace with your key from Razorpay dashboard

// ── Create order in Supabase & open Razorpay checkout ────────
export async function initiatePayment(shippingAddress) {
  const user = await getUser();
  if (!user) return;

  const cartItems = await getCart();
  if (!cartItems.length) {
    alert('Your cart is empty!');
    return;
  }

  const totalAmount = calcCartTotal(cartItems);
  const orderNumber = 'MDK-' + Date.now();

  // 1. Create pending order in Supabase
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      order_number: orderNumber,
      status: 'pending',
      total_amount: totalAmount,
      shipping_address: shippingAddress,
      payment_method: 'razorpay',
    })
    .select()
    .single();

  if (orderErr) throw orderErr;

  // 2. Insert order items
  const orderItems = cartItems.map(item => ({
    order_id: order.id,
    product_id: item.products.id,
    quantity: item.quantity,
    size: item.size,
    color: item.color,
    unit_price: item.products.price,
  }));
  await supabase.from('order_items').insert(orderItems);

  // 3. Open Razorpay modal
  const options = {
    key: RAZORPAY_KEY_ID,
    amount: Math.round(totalAmount * 100), // in paise
    currency: 'INR',
    name: 'Madhurakshi Official',
    description: `Order ${orderNumber}`,
    image: '/assets/logo.png',
    prefill: {
      name: user.user_metadata?.full_name || '',
      email: user.email,
      contact: user.user_metadata?.phone || '',
    },
    notes: { order_id: order.id },
    theme: { color: '#b8922a' },

    handler: async function (response) {
      // 4. Payment success — update order with payment_id
      await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          payment_id: response.razorpay_payment_id,
        })
        .eq('id', order.id);

      // 5. Clear cart
      await clearCart();

      // 6. Redirect to success page
      window.location.href = `/orders.html?order=${order.id}&success=true`;
    },

    modal: {
      ondismiss: async function () {
        // Payment cancelled — mark order as cancelled
        await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', order.id);
      }
    }
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}

// ── Get user's order history ──────────────────────────────────
export async function getOrders() {
  const user = await getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, total_amount, payment_method,
      payment_id, shipping_address, created_at,
      order_items (
        id, quantity, size, color, unit_price,
        products ( id, name, images )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}