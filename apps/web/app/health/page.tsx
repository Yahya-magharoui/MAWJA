import { buildApiUrl } from '../../lib/api';

export const dynamic = 'force-dynamic';

export default async function Health() {
  let status = "unknown";
  try {
    const res = await fetch(buildApiUrl('/health'), { cache: 'no-store' });
    status = res.ok ? "ok" : "down";
  } catch {
    status = "down";
  }
  return <pre style={{ padding: 24 }}>API status: {status}</pre>;
}
