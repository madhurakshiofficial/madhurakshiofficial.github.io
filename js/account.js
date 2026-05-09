/**
 * madhurakshi — Account Button & Logout Component
 * 
 * USAGE: Drop this <script> tag into ANY page on your site:
 *   <script src="account-button.js"></script>
 *
 * Then place this element wherever you want the button:
 *   <div id="account-btn-mount"></div>
 *
 * It auto-detects session state and renders:
 *   - Signed OUT → links to auth.html
 *   - Signed IN  → links to account.html + shows logout option
 */

(function () {
  const SUPABASE_URL = 'https://cvhepeydpmxmwjmenrqz.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2aGVwZXlkcG14bXdqbWVucnF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MTk2OTksImV4cCI6MjA5MTE5NTY5OX0.hLDAcPvwfk3w7K8_YRZwAu55kK_hEAbevPQd-fkDNl8';

  /* ── Inject styles ── */
  const style = document.createElement('style');
  style.textContent = `
    .mdk-acct-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 9px 16px; background: transparent;
      border: 1px solid rgba(26,22,18,0.22); border-radius: 4px;
      font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 400;
      color: #1A1612; cursor: pointer; text-decoration: none;
      transition: border-color 0.18s, background 0.18s; position: relative;
      letter-spacing: 0.01em; white-space: nowrap;
    }
    .mdk-acct-btn:hover { background: #FAF7F2; border-color: #C4935A; }
    .mdk-acct-btn svg { flex-shrink: 0; }

    /* Avatar pill when signed in */
    .mdk-acct-pill {
      display: inline-flex; align-items: center; gap: 0;
      border: 1px solid rgba(26,22,18,0.22); border-radius: 4px;
      overflow: hidden; font-family: 'DM Sans', sans-serif; font-size: 13px;
      background: transparent; position: relative;
    }
    .mdk-acct-pill__user {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 14px; cursor: pointer; text-decoration: none;
      color: #1A1612; transition: background 0.18s;
    }
    .mdk-acct-pill__user:hover { background: #FAF7F2; }
    .mdk-acct-avatar {
      width: 22px; height: 22px; border-radius: 50%;
      background: #C4935A; display: flex; align-items: center;
      justify-content: center; font-size: 10px; font-weight: 500;
      color: #FFFEFB; flex-shrink: 0; letter-spacing: 0;
    }
    .mdk-acct-pill__divider {
      width: 1px; height: 34px; background: rgba(26,22,18,0.14); flex-shrink: 0;
    }
    .mdk-acct-pill__logout {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 14px; cursor: pointer; background: transparent;
      border: none; font-family: 'DM Sans', sans-serif; font-size: 13px;
      color: #8A7F74; transition: background 0.18s, color 0.18s;
    }
    .mdk-acct-pill__logout:hover { background: #FDF0EE; color: #C0392B; }
    .mdk-acct-pill__logout:active { transform: scale(0.97); }

    /* Skeleton loader */
    .mdk-acct-skeleton {
      width: 120px; height: 36px; border-radius: 4px;
      background: linear-gradient(90deg, #f0ebe3 25%, #faf7f2 50%, #f0ebe3 75%);
      background-size: 200% 100%; animation: mdk-shimmer 1.2s infinite;
    }
    @keyframes mdk-shimmer { to { background-position: -200% 0; } }
  `;
  document.head.appendChild(style);

  /* ── Wait for Supabase SDK ── */
  function waitForSupabase(cb) {
    if (window.supabase) { cb(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = cb;
    document.head.appendChild(script);
  }

  function initBtn() {
    const mount = document.getElementById('account-btn-mount');
    if (!mount) return; // no mount point found

    // Show skeleton while checking session
    mount.innerHTML = '<div class="mdk-acct-skeleton"></div>';

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    client.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // ── Not signed in → simple "Account" button → auth.html
        mount.innerHTML = `
          <a href="auth.html" class="mdk-acct-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Account
          </a>
        `;
      } else {
        // ── Signed in → avatar pill → account.html + logout
        const user = session.user;
        const name = user.user_metadata?.full_name || user.email || '';
        const initials = name
          ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
          : '??';
        const firstName = name.split(' ')[0] || 'Account';

        mount.innerHTML = `
          <div class="mdk-acct-pill">
            <a href="account.html" class="mdk-acct-pill__user" title="My account">
              <div class="mdk-acct-avatar">${initials}</div>
              <span>${firstName}</span>
            </a>
            <div class="mdk-acct-pill__divider"></div>
            <button class="mdk-acct-pill__logout" id="mdk-logout-btn" title="Sign out">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>
          </div>
        `;

        document.getElementById('mdk-logout-btn').addEventListener('click', async () => {
          await client.auth.signOut();
          window.location.reload();
        });
      }
    });
  }

  waitForSupabase(initBtn);
})();