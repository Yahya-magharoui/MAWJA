'use client';

import { useEffect, useMemo, useState } from 'react';
import type { SessionProfile } from '../lib/session';
import {
  fetchPatientAssignmentStatus,
  getDoctorById,
  submitAssignmentRequest,
  type DoctorAssignmentRequest,
} from '../lib/doctorAssignment';
import { withAlpha } from './theme';

type Props = {
  themeColor: string;
  profile: SessionProfile | null;
  authenticated: boolean;
  embedded?: boolean;
};

export default function PatientAssignmentCard({ themeColor, profile, authenticated, embedded = false }: Props) {
  const [doctorCode, setDoctorCode] = useState('');
  const [status, setStatus] = useState<DoctorAssignmentRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const current = await fetchPatientAssignmentStatus(profile);
      if (!cancelled) setStatus(current);
    }

    if (authenticated) {
      void load();
    }

    return () => {
      cancelled = true;
    };
  }, [authenticated, profile]);

  const doctor = useMemo(() => (status ? getDoctorById(status.requestedDoctorId) : null), [status]);

  async function handleSubmit() {
    if (!doctorCode.trim() || busy) return;

    try {
      setBusy(true);
      setMessage(null);
      const nextStatus = await submitAssignmentRequest(profile, doctorCode);
      setStatus(nextStatus);
      setDoctorCode('');
      setMessage('Demande envoyée au médecin. Tu seras notifié dès qu’une décision sera prise.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Impossible d’envoyer la demande.');
    } finally {
      setBusy(false);
    }
  }

  if (!authenticated) return null;

  return (
    <section
      style={{
        maxWidth: embedded ? '100%' : 520,
        margin: embedded ? 0 : '6px auto 10px',
        padding: embedded ? 0 : '0 20px',
        width: '100%',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 22,
          padding: '18px 18px',
          border: '1px solid rgba(15,23,42,.07)',
          boxShadow: `0 12px 24px ${withAlpha(themeColor, 0.12)}`,
          display: 'grid',
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>Affectation à un médecin</h2>
          <p style={{ margin: '6px 0 0', color: '#475569', lineHeight: 1.5 }}>
            Saisis le code unique de ton médecin pour lui envoyer une demande d’affectation.
          </p>
        </div>

        {status ? (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 16,
              background: '#f8fafc',
              border: '1px solid rgba(15,23,42,.06)',
              display: 'grid',
              gap: 4,
            }}
          >
            <strong>Statut : {statusLabel(status.status)}</strong>
            <span style={{ color: '#475569', fontSize: 14 }}>
              Médecin ciblé : {doctor?.name ?? status.requestedDoctorCode}
            </span>
            <span style={{ color: '#64748b', fontSize: 13 }}>
              Mise à jour : {new Date(status.updatedAt).toLocaleString('fr-FR')}
            </span>
            {status.rejectionReason ? (
              <span style={{ color: '#991b1b', fontSize: 13 }}>Motif : {status.rejectionReason}</span>
            ) : null}
          </div>
        ) : null}

        <div style={{ display: 'grid', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Code médecin</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
            <input
              value={doctorCode}
              onChange={(event) => setDoctorCode(event.target.value.toUpperCase())}
              placeholder="Ex. DOC-SARAH"
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid #dbe1f0',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={busy}
              style={{
                padding: '12px 14px',
                border: 'none',
                borderRadius: 12,
                background: themeColor,
                color: '#fff',
                fontWeight: 700,
                cursor: busy ? 'default' : 'pointer',
                opacity: busy ? 0.72 : 1,
              }}
            >
              {busy ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </div>

        {message ? <p style={{ margin: 0, color: message.includes('Impossible') || message.includes('introuvable') ? '#991b1b' : '#166534' }}>{message}</p> : null}
      </div>
    </section>
  );
}

function statusLabel(status: DoctorAssignmentRequest['status']) {
  if (status === 'ACCEPTED') return 'Acceptée';
  if (status === 'REJECTED') return 'Refusée';
  return 'En attente';
}
