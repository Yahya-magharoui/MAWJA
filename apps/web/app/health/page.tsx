import { buildApiUrl } from '../../lib/api';

export default async function Health() {
  let status = "unknown";
  try {
    const res = await fetch(buildApiUrl('/health'));
    status = res.ok ? "ok" : "down";
  } catch {
    status = "down";
  }
  return <pre style={{ padding: 24 }}>API status: {status}</pre>;
}
