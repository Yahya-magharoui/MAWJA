export default async function Health() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  let status = "unknown";
  try {
    const res = await fetch(apiUrl + "/health");
    status = res.ok ? "ok" : "down";
  } catch {
    status = "down";
  }
  return <pre style={{ padding: 24 }}>API status: {status}</pre>;
}
