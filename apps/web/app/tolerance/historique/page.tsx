'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import BackLink from '../../../components/BackLink';
import { useThemeColor, withAlpha } from '../../../components/theme';
import { fetchPatientHistories, setLastHistoryId, type HistoryState, type PatientHistory } from '../../../lib/patientTracking';

type StateType = 'Hyper' | 'Hypo' | 'Tolérance';
type Row = {
  id: string;
  time: string;
  state: StateType;
  emotion: string;
  backMins?: number;
};

function toStateLabel(state: HistoryState): StateType {
  if (state === 'HYPER') return 'Hyper';
  if (state === 'HYPO') return 'Hypo';
  return 'Tolérance';
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function toRow(history: PatientHistory): Row {
  return {
    id: String(history.id),
    time: formatTime(history.time),
    state: toStateLabel(history.state),
    emotion: '—',
    backMins: 0,
  };
}

export default function HistoryPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useThemeColor();
  const bg = useMemo(
    () => `radial-gradient(1200px 800px at 50% -10%, ${withAlpha(theme, 0.13)} 0%, #F6F7FE 55%)`,
    [theme]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadHistories() {
      try {
        setLoading(true);
        setError(null);

        const histories = await fetchPatientHistories();
        if (cancelled) return;

        if (histories[0]?.id != null) {
          setLastHistoryId(histories[0].id);
        }
        setRows(histories.map(toRow));
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Impossible de charger l’historique.';
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadHistories();

    return () => {
      cancelled = true;
    };
  }, []);

  const stateBadge = (s: StateType) => {
    const base = { padding: '6px 10px', borderRadius: 12, fontWeight: 700, fontSize: 13 } as const;
    if (s === 'Hyper') return <span style={{ ...base, background: '#fee2e2', color: '#b91c1c' }}>Hyper</span>;
    if (s === 'Hypo') return <span style={{ ...base, background: '#e0f2fe', color: '#0369a1' }}>Hypo</span>;
    return <span style={{ ...base, background: '#dcfce7', color: '#166534' }}>Tolérance</span>;
  };

  /** Export PDF dynamique (sans import statique) **/
  const exportToPDF = async () => {
    // Import dynamique (évite les erreurs SSR)
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

    // --- Watermark diagonal "KALIMA" ---
    doc.setFontSize(60);
    doc.setTextColor(230, 230, 230);
    try {
      (doc as any).setGState?.({ opacity: 0.18 });
    } catch {}
    doc.text('KALIMA', 200, 400, { angle: 45 });

    // --- Titre ---
    doc.setFontSize(20);
    doc.setTextColor(33, 33, 33);
    doc.text('Historique des états émotionnels', 40, 60);

    // --- Tableau ---
    autoTable(doc, {
      startY: 100,
      head: [['ID', 'Heure', 'État', 'Racine d’émotion', 'Retour FT']],
      body: rows.map((r) => [
        r.id,
        r.time,
        r.state,
        r.emotion,
        r.backMins ? `${r.backMins} min` : '—',
      ]),
      theme: 'grid',
      styles: { fontSize: 11, cellPadding: 6 },
      headStyles: { fillColor: [167, 139, 250], textColor: 255, fontStyle: 'bold' },
    });

    // --- Pied de page ---
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text('Généré par KALIMA - © 2025', 40, pageHeight - 30);

    // --- Téléchargement ---
    doc.save('Historique_KALIMA.pdf');
  };

  return (
    <main style={{ ...wrap, background: bg }}>
      <header style={hdr}>
        <BackLink href={null} onClick={() => router.back()} style={backBtn} />
        <h1 style={{ margin: 0, fontSize: 20 }}>Mon historique</h1>
        <div />
      </header>

      <div style={{ padding: '0 20px', maxWidth: 980, margin: '0 auto 40px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Tableau des enregistrements</h2>
          <button onClick={exportToPDF} style={pdfBtn}>
            📄 Exporter en PDF
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '60px 120px 140px 1fr 120px',
            gap: 10,
            fontWeight: 800,
            marginBottom: 10,
          }}
        >
          <div>ID</div>
          <div>Heure</div>
          <div>État</div>
          <div>Racine d’émotion</div>
          <div style={{ textAlign: 'right' }}>Tps retour FT</div>
        </div>

        {loading && <div style={infoCard}>Chargement de l’historique…</div>}
        {error && !loading && <div style={infoCard}>{error}</div>}
        {!loading && !error && rows.length === 0 && <div style={infoCard}>Aucun historique disponible.</div>}

        {!loading && !error && rows.map((r) => (
          <div
            key={r.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '60px 120px 140px 1fr 120px',
              gap: 10,
              padding: '12px 14px',
              background: '#fff',
              border: '1px solid #eee',
              borderRadius: 10,
              marginBottom: 8,
              alignItems: 'center',
            }}
          >
            <div style={{ fontWeight: 700 }}>{r.id}</div>
            <div>{r.time}</div>
            <div>{stateBadge(r.state)}</div>
            <div>{r.emotion}</div>
            <div style={{ textAlign: 'right' }}>{r.backMins ? `${r.backMins} min` : '—'}</div>
          </div>
        ))}
      </div>
    </main>
  );
}

/* --- Styles --- */
const wrap = {
  minHeight: '100dvh',
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  color: '#0f172a',
} as const;

const hdr = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  alignItems: 'center',
  padding: '16px 20px',
} as const;

const backBtn = {
  background: 'none',
  border: 'none',
  fontSize: 22,
  cursor: 'pointer',
  color: '#111',
} as const;

const pdfBtn = {
  background: 'var(--theme-color)',
  border: 'none',
  borderRadius: 10,
  color: '#fff',
  fontWeight: 700,
  padding: '10px 14px',
  cursor: 'pointer',
  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
} as const;

const infoCard = {
  padding: '14px 16px',
  background: '#fff',
  border: '1px solid #eee',
  borderRadius: 10,
  color: '#334155',
} as const;
