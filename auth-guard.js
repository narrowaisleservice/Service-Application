// auth-guard.js
// Include near the top of every page, AFTER setting window.ALLOWED_ROLES
// for that page:
//
//   <script>window.ALLOWED_ROLES = ['internal', 'dealer'];</script>
//   <script type="module" src="auth-guard.js"></script>
//
// Any page that doesn't set window.ALLOWED_ROLES defaults to internal-only.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://dontubctlexlvifwhmbj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_99HLzSv4wMwFZHlR81yIsQ_z0A0Jpth';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ALLOWED_ROLES = window.ALLOWED_ROLES || ['internal'];

function showGuardMessage(text, redirectTo) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: #ffffff;
    display: flex; align-items: center; justify-content: center;
    font-family: 'IBM Plex Sans', 'DM Sans', sans-serif;
  `;
  overlay.innerHTML = `
    <div style="text-align:center; padding: 24px;">
      <div style="width:40px;height:40px;border-radius:50%;background:#df0a1e;
                  display:flex;align-items:center;justify-content:center;
                  margin:0 auto 16px;color:#fff;font-size:20px;font-weight:700;">!</div>
      <div style="font-size:15px;color:#1a1a1a;font-weight:600;">${text}</div>
      <div style="font-size:12px;color:#999;margin-top:6px;">Redirecting…</div>
    </div>
  `;
  document.documentElement.appendChild(overlay);
  setTimeout(() => { window.location.href = redirectTo; }, 1100);
}

const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  showGuardMessage('Please log in to view this page', 'login.html');
} else {
  const role = session.user.app_metadata?.role || 'internal';
  if (!ALLOWED_ROLES.includes(role)) {
    showGuardMessage("You don't have access to this page", 'portal-hub-professional.html');
  }
}
