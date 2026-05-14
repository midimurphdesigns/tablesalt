import { AppShell } from '@/components/AppShell';

// Server component wrapper. Forces dynamic rendering so the client
// component child (AppShell) renders on every request rather than
// being statically prerendered into a 404 shell — Next 16 + Turbopack
// production behavior was returning 404 for a client-only homepage
// without this explicit opt-out.
export const dynamic = 'force-dynamic';

export default function Page() {
  return <AppShell />;
}
