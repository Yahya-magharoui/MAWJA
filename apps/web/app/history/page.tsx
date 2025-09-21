'use client';

import { useEffect, useMemo, useState } from 'react';

type Mood = {
  id: string;
  state: 'hypo' | 'window' | 'hyper';
  value: number;
  context?: string | null;
  timestamp: string; // ISO
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function stateLabel(s: Mood['state']) {
  if (s === 'hypo') return 'Hypo';
  if (s === 'hyper') return 'Hyper';
  return 'Fenêtre';
}

export default function HistoryPage() {
  const [range, setRange] = useState<'day' | 'week' | 'month'>('week');
  const [items, setItems] = useState<Mood[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/mood?userId=u1&range=${range}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = (await res.json()) as Mood[];
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const stats = useMemo(() => {
    const total = items.length || 1;
    const count = { hypo: 0, window: 0, hyper: 0 } as Record<Mood['state'], number>;
    items.forEach(i => (count[i.state] += 1));
    return {
      hypo: Math.round((count.hypo / total) * 100),
      window: Math.round((count.window / total) * 100),
      hyper: Math.round((count.hyper / total) * 100),
      total: items.length,
    };
  }, [items]);

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 900, margin: '0 auto' }}>
      <h1>Historique des états</h1>
      <p style={{ marginBottom: 8 }}>
        Période :
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as any)}
          style={{ marginLeft: 8, padding: '6px 8px', borderRadius: 8 }}
        >
          <option value="day">Dernières 24h</option>
          <option value="week">Dernière semaine</option>
          <option value="month">Dernier mois</option>
        </select>
        <button onClick={load} disabled={loading} style={{ marginLeft: 12, padding: '6px 12px', borderRadius: 8 }}>
          {loading ? 'Chargement…' : 'Rafraîchir'}
        </button>
      </p>

      {/* Résumé rapide */}
      <div style={{ display: 'flex', gap: 12, margin: '12px 0' }}>
        <Badge label="Hypo" value={stats.hypo + '%'} tone="#cbd5e1" />
        <Badge label="Fenêtre" value={stats.window + '%'} tone="#a7f3d0" />
        <Badge label="Hyper" value={stats.hyper + '%'} tone="#fecaca" />
        <Badge label="Total" value={String(stats.total)} tone="#e5e7eb" />
      </div>

      {error && <p style={{ color: 'crimson' }}>Erreur : {error}</p>}
      {!error && items.length === 0 && !loading && <p>Aucune donnée sur la période choisie.</p>}

      {/* Tableau */}
      {items.length > 0 && (
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: 8 }}>Date</th>
                <th style={{ padding: 8 }}>État</th>
                <th style={{ padding: 8 }}>Intensité</th>
                <th style={{ padding: 8 }}>Contexte</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f2f2f2' }}>
                  <td style={{ padding: 8, whiteSpace: 'nowrap' }}>{formatDate(m.timestamp)}</td>
                  <td style={{ padding: 8 }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 999,
                      background:
                        m.state === 'hypo' ? '#e2e8f0' :
                        m.state === 'hyper' ? '#fee2e2' :
                        '#d1fae5'
                    }}>
                      {stateLabel(m.state)}
                    </span>
                  </td>
                  <td style={{ padding: 8 }}>{m.value}</td>
                  <td style={{ padding: 8 }}>{m.context ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: 16 }}><a href="/">⬅ Retour</a></p>
    </main>
  );
}

function Badge({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div style={{ background: tone, borderRadius: 12, padding: '8px 12px' }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}
