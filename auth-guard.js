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
const SUPABASE_ANON_KEY = 'sb_publishable_99HLzSv4wMwFZHlR81yIsQ_z0A0Jpth'; // same key already used in login.html

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ALLOWED_ROLES = window.ALLOWED_ROLES || ['internal'];

const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  window.location.href = 'login.html';
} else {
  const role = session.user.app_metadata?.role || 'internal';
  if (!ALLOWED_ROLES.includes(role)) {
    window.location.href = 'portal-hub-professional.html';
  }
}
