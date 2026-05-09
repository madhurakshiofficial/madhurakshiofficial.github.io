// ============================================================
// js/search.js  —  Product search
// WHERE TO ADD:
//   1. In products.html: <script type="module" src="js/search.js"></script>
//   2. Add a search input in your header: <input id="searchInput" type="text" placeholder="Search..."/>
//   3. The search bar in index.html should redirect: /products.html?q=QUERY
//   4. products.html reads ?q= param and calls searchProducts() on load
// ============================================================
import { supabase } from './supabase.js';

// ── Full-text search across name + description ────────────────
// Uses Supabase ilike — works without any DB config changes
export async function searchProducts(query, categorySlug = null) {
  let req = supabase
    .from('products')
    .select('id, name, price, images, category, category_id')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

  if (categorySlug) {
    // filter by category slug via join
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();
    if (cat) req = req.eq('category_id', cat.id);
  }

  const { data, error } = await req.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ── Filter by category ────────────────────────────────────────
export async function getProductsByCategory(categorySlug) {
  const { data: cat, error: catErr } = await supabase
    .from('categories')
    .select('id, name')
    .eq('slug', categorySlug)
    .single();

  if (catErr || !cat) throw new Error('Category not found');

  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, images, category')
    .or(`category_id.eq.${cat.id},category.ilike.${cat.name}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return { category: cat, products: data };
}

// ── Init: reads ?q= or ?category= from URL and renders results ─
export async function initSearchPage(renderFn) {
  const params   = new URLSearchParams(window.location.search);
  const query    = params.get('q')?.trim() || '';
  const category = params.get('category') || null;

  const searchInput = document.getElementById('searchInput');
  if (searchInput && query) searchInput.value = query;

  // Live search on input
  if (searchInput) {
    searchInput.addEventListener('input', async (e) => {
      const q = e.target.value.trim();
      if (q.length < 2) return;
      const results = await searchProducts(q);
      renderFn(results, q);
    });
  }

  if (query) {
    const results = await searchProducts(query, category);
    renderFn(results, query);
  } else if (category) {
    const { products } = await getProductsByCategory(category);
    renderFn(products, category);
  }
}

// ── Search bar in header (index.html + all pages) ─────────────
// Add this to your shared header HTML:
//   <form id="searchForm">
//     <input id="globalSearch" type="text" placeholder="Search dresses, lehengas…"/>
//     <button type="submit">Search</button>
//   </form>
export function initGlobalSearch() {
  const form = document.getElementById('searchForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = document.getElementById('globalSearch')?.value?.trim();
    if (q) window.location.href = `/products.html?q=${encodeURIComponent(q)}`;
  });
}