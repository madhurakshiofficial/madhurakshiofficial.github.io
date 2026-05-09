// ============================================================
// js/auth.js  —  Sign In / Sign Up / Sign Out / Session
// Add <script type="module" src="js/auth.js"></script> to auth.html
// Call requireAuth() at top of cart.html, checkout.html, orders.html
// ============================================================
import { supabase } from './supabase.js';

// ── Sign Up ──────────────────────────────────────────────────
export async function signUp(email, password, fullName, phone) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone }
    }
  });
  if (error) throw error;

  // Create profile row
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      phone,
      role: 'customer'
    });
  }
  return data;
}

// ── Sign In ──────────────────────────────────────────────────
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// ── Sign Out ─────────────────────────────────────────────────
export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = '/auth.html';
}

// ── Get current session user ──────────────────────────────────
export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

// ── Protect pages — redirect to auth if not logged in ────────
export async function requireAuth(redirectTo = '/auth.html') {
  const user = await getUser();
  if (!user) {
    sessionStorage.setItem('redirectAfterLogin', window.location.href);
    window.location.href = redirectTo;
  }
  return user;
}

// ── Update header UI based on auth state ──────────────────────
export function initAuthHeader() {
  supabase.auth.onAuthStateChange((event, session) => {
    const loginLink  = document.getElementById('nav-login');
    const logoutBtn  = document.getElementById('nav-logout');
    const userLabel  = document.getElementById('nav-user');

    if (session?.user) {
      if (loginLink)  loginLink.style.display  = 'none';
      if (logoutBtn)  logoutBtn.style.display  = 'inline-flex';
      if (userLabel)  userLabel.textContent    = session.user.user_metadata?.full_name?.split(' ')[0] || 'Account';
    } else {
      if (loginLink)  loginLink.style.display  = 'inline-flex';
      if (logoutBtn)  logoutBtn.style.display  = 'none';
      if (userLabel)  userLabel.textContent    = '';
    }
  });
}