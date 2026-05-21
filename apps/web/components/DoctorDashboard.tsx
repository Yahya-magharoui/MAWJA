'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  acceptAssignmentRequest,
  fetchDoctorAssignmentRequests,
  getDoctorById,
  getDoctorDirectory,
  getDoctorForProfile,
  rejectAssignmentRequest,
  transferAssignmentRequest,
  type DoctorAssignmentRequest,
} from '../lib/doctorAssignment';
import type { SessionProfile } from '../lib/session';
import { fetchDoctorDashboard, type DoctorDashboardData, type DoctorPatientSummary } from '../lib/doctorDashboard';
import { tintColor, withAlpha } from './theme';

type Props = {
  themeColor: string;
  profile: SessionProfile | null;
};

type DoctorView = 'notifications' | 'profile' | 'history';

export default function DoctorDashboard({ themeColor, profile }: Props) {
  const [data, setData] = useState<DoctorDashboardData | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<DoctorView>('notifications');
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [requests, setRequests] = useState<DoctorAssignmentRequest[]>([]);
  const [transferMap, setTransferMap] = useState<Record<string, string>>({});
  const [rejectionMap, setRejectionMap] = useState<Record<string, string>>({});

  const currentDoctor = useMemo(() => getDoctorForProfile(profile), [profile]);
  const availableDoctors = useMemo(
    () => getDoctorDirectory().filter((doctor) => doctor.id !== currentDoctor?.id),
    [currentDoctor]
  );
  const mergedPatients = useMemo(() => {
    if (!data) return [] as DoctorPatientSummary[];

    const existingIds = new Set(data.patients.map((patient) => patient.id));
    const assignedPatients = requests
      .filter((request) => request.status === 'ACCEPTED')
      .filter((request) => !existingIds.has(request.patientUserId))
      .map<DoctorPatientSummary>((request) => ({
        id: request.patientUserId,
        name: request.patientName,
        age: 0,
        currentSituation: 'Nouveau patient affecté, dossier détaillé à hydrater via l’API.',
        lastActivity: `Affectation acceptée le ${new Date(request.updatedAt).toLocaleDateString('fr-FR')}`,
        sections: [
          {
            id: 'identity',
            label: 'Informations du patient',
            summary: 'Patient ajouté depuis une demande d’affectation.',
            details: [`Email : ${request.patientEmail}`, `Code médecin : ${request.requestedDoctorCode}`],
          },
        ],
        historyGroups: [
          {
            id: 'today',
            label: 'Aujourd hui',
            entries: [],
          },
        ],
      }));

    return [...assignedPatients, ...data.patients];
  }, [data, requests]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [response, nextRequests] = await Promise.all([
        fetchDoctorDashboard(),
        currentDoctor ? fetchDoctorAssignmentRequests(currentDoctor.id) : Promise.resolve([]),
      ]);
      if (cancelled) return;
      setData(response);
      setRequests(nextRequests);
      setSelectedPatientId(response.patients[0]?.id ?? null);
      setExpandedSectionId(response.patients[0]?.sections[0]?.id ?? null);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [currentDoctor]);

  async function refreshRequests() {
    if (!currentDoctor) return;
    setRequests(await fetchDoctorAssignmentRequests(currentDoctor.id));
  }

  const selectedPatient = useMemo<DoctorPatientSummary | null>(
    () => mergedPatients.find((patient) => patient.id === selectedPatientId) ?? null,
    [mergedPatients, selectedPatientId]
  );

  if (!data || !selectedPatient) {
    return <div style={loadingCard}>Chargement du dashboard medecin…</div>;
  }

  return (
    <section style={layout}>
      <aside style={sidebar(themeColor)}>
        <div>
          <p style={eyebrow}>Dashboard medecin</p>
          <h2 style={sidebarTitle}>Mes patients</h2>
          <p style={sidebarText}>
            {data.doctor.name} · {data.doctor.specialty}
          </p>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {mergedPatients.map((patient) => {
            const selected = patient.id === selectedPatientId;
            return (
              <button
                key={patient.id}
                type="button"
                onClick={() => {
                  setSelectedPatientId(patient.id);
                  setExpandedSectionId(patient.sections[0]?.id ?? null);
                }}
                style={patientButton(themeColor, selected)}
              >
                <strong>{patient.name}</strong>
                <span style={{ opacity: 0.72, fontSize: 13 }}>{patient.currentSituation}</span>
                <span style={{ opacity: 0.62, fontSize: 12 }}>Derniere activite : {patient.lastActivity}</span>
              </button>
            );
          })}
        </div>
      </aside>

      <div style={content}>
        <header style={hero(themeColor)}>
          <div>
            <p style={eyebrow}>{activeView === 'notifications' ? 'Centre de suivi' : 'Patient selectionne'}</p>
            <h2 style={heroTitle}>{activeView === 'notifications' ? 'Notifications' : selectedPatient.name}</h2>
            <p style={heroText}>
              {activeView === 'notifications'
                ? `${requests.filter((request) => request.status === 'PENDING').length} demande(s) d’affectation en attente`
                : `${selectedPatient.age} ans · ${selectedPatient.currentSituation}`}
            </p>
          </div>
          <div style={switchWrap}>
            <button type="button" onClick={() => setActiveView('notifications')} style={switchBtn(themeColor, activeView === 'notifications')}>
              Notifications
            </button>
            <button type="button" onClick={() => setActiveView('profile')} style={switchBtn(themeColor, activeView === 'profile')}>
              Profil
            </button>
            <button type="button" onClick={() => setActiveView('history')} style={switchBtn(themeColor, activeView === 'history')}>
              Historique
            </button>
          </div>
        </header>

        {activeView === 'notifications' ? (
          <section style={{ display: 'grid', gap: 16 }}>
            <article style={panel}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <h3 style={panelTitle}>Demandes d’affectation</h3>
                <span style={requestBadge}>{requests.filter((request) => request.status === 'PENDING').length}</span>
              </div>
              {requests.length === 0 ? <p style={panelSummary}>Aucune notification pour le moment.</p> : null}
              <div style={{ display: 'grid', gap: 12 }}>
                {requests.map((request) => (
                  <div key={request.id} style={requestCard}>
                    <div style={{ display: 'grid', gap: 4 }}>
                      <strong>{request.patientName}</strong>
                      <span style={{ fontSize: 13, color: '#475569' }}>{request.patientEmail}</span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>
                        Reçue le {new Date(request.createdAt).toLocaleString('fr-FR')}
                      </span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>
                        Statut : {request.status === 'PENDING' ? 'En attente' : request.status === 'ACCEPTED' ? 'Acceptée' : 'Refusée'}
                      </span>
                    </div>

                    {request.status === 'PENDING' && currentDoctor ? (
                      <div style={{ display: 'grid', gap: 10 }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => void acceptAssignmentRequest(request.id, currentDoctor.id).then(refreshRequests)}
                            style={actionBtn(themeColor)}
                          >
                            Accepter
                          </button>
                        </div>

                        <div style={{ display: 'grid', gap: 8 }}>
                          <label style={fieldLabel}>Justification du refus</label>
                          <textarea
                            value={rejectionMap[request.id] ?? ''}
                            onChange={(event) => setRejectionMap((prev) => ({ ...prev, [request.id]: event.target.value }))}
                            placeholder="Expliquer pourquoi la demande est refusée"
                            rows={3}
                            style={textareaStyle}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              void rejectAssignmentRequest(
                                request.id,
                                currentDoctor.id,
                                rejectionMap[request.id]?.trim() || 'Refus sans précision'
                              ).then(refreshRequests)
                            }
                            style={ghostBtn}
                          >
                            Refuser
                          </button>
                        </div>

                        <div style={{ display: 'grid', gap: 8 }}>
                          <label style={fieldLabel}>Transférer vers un autre médecin</label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                            <select
                              value={transferMap[request.id] ?? availableDoctors[0]?.id ?? ''}
                              onChange={(event) => setTransferMap((prev) => ({ ...prev, [request.id]: event.target.value }))}
                              style={selectStyle}
                            >
                              {availableDoctors.map((doctor) => (
                                <option key={doctor.id} value={doctor.id}>
                                  {doctor.name}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                const nextDoctorId = transferMap[request.id] ?? availableDoctors[0]?.id;
                                if (!nextDoctorId || !currentDoctor) return;
                                void transferAssignmentRequest(request.id, currentDoctor.id, nextDoctorId).then(refreshRequests);
                              }}
                              style={ghostBtn}
                            >
                              Transférer
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: 4 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          {request.reviewedByDoctorId ? `Traité par ${getDoctorById(request.reviewedByDoctorId)?.name ?? 'un médecin'}` : 'En attente'}
                        </span>
                        {request.rejectionReason ? <span style={{ fontSize: 12, color: '#991b1b' }}>Justification : {request.rejectionReason}</span> : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </article>
          </section>
        ) : activeView === 'profile' ? (
          <section style={grid}>
            {selectedPatient.sections.map((section) => {
              const expanded = section.id === expandedSectionId;
              return (
                <article key={section.id} style={panel}>
                  <button
                    type="button"
                    onClick={() => setExpandedSectionId(expanded ? null : section.id)}
                    style={sectionHeader}
                  >
                    <div>
                      <h3 style={panelTitle}>{section.label}</h3>
                      <p style={panelSummary}>{section.summary}</p>
                    </div>
                    <span style={{ fontSize: 20, opacity: 0.5 }}>{expanded ? '−' : '+'}</span>
                  </button>
                  {expanded ? (
                    <ul style={detailList}>
                      {section.details.map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              );
            })}
          </section>
        ) : (
          <section style={{ display: 'grid', gap: 16 }}>
            {selectedPatient.historyGroups.map((group) => (
              <article key={group.id} style={panel}>
                <h3 style={panelTitle}>{group.label}</h3>
                {group.entries.length === 0 ? <p style={panelSummary}>Aucune connexion sur cette periode.</p> : null}
                <div style={{ display: 'grid', gap: 10 }}>
                  {group.entries.map((entry) => (
                    <div key={entry.id} style={historyCard(themeColor)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <strong>{entry.label}</strong>
                        <span style={{ opacity: 0.65 }}>{entry.time}</span>
                      </div>
                      <div style={historyMeta}>
                        <span>Evolution : {entry.stateChange}</span>
                        <span>Exercices : {entry.exercisesCount}</span>
                        <span>Duree : {entry.duration}</span>
                      </div>
                      <p style={{ margin: 0, color: '#475569' }}>{entry.notes}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </section>
  );
}

const layout: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(260px, 320px) 1fr',
  gap: 18,
  padding: '12px 20px 24px',
  maxWidth: 1240,
  margin: '0 auto',
  width: '100%',
};

const content: React.CSSProperties = {
  display: 'grid',
  gap: 18,
  alignContent: 'start',
};

const loadingCard: React.CSSProperties = {
  maxWidth: 920,
  margin: '20px auto',
  padding: '18px 20px',
  borderRadius: 20,
  background: '#fff',
  boxShadow: '0 12px 28px rgba(15,23,42,.08)',
};

const sidebar = (themeColor: string): React.CSSProperties => ({
  display: 'grid',
  gap: 16,
  alignContent: 'start',
  background: `linear-gradient(180deg, ${withAlpha(themeColor, 0.18)} 0%, #ffffff 100%)`,
  borderRadius: 26,
  padding: 18,
  boxShadow: `0 20px 36px ${withAlpha(themeColor, 0.18)}`,
});

const eyebrow: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  opacity: 0.58,
};

const sidebarTitle: React.CSSProperties = {
  margin: '6px 0 4px',
  fontSize: 26,
};

const sidebarText: React.CSSProperties = {
  margin: 0,
  color: '#475569',
  lineHeight: 1.5,
};

const patientButton = (themeColor: string, selected: boolean): React.CSSProperties => ({
  display: 'grid',
  gap: 4,
  textAlign: 'left',
  padding: '14px 14px',
  borderRadius: 18,
  border: selected ? `1px solid ${themeColor}` : '1px solid rgba(15,23,42,.08)',
  background: selected ? tintColor(themeColor, 0.82) : '#fff',
  boxShadow: selected ? `0 10px 22px ${withAlpha(themeColor, 0.18)}` : 'none',
  cursor: 'pointer',
});

const requestPanel = (themeColor: string): React.CSSProperties => ({
  display: 'grid',
  gap: 10,
  padding: 14,
  borderRadius: 18,
  background: '#fff',
  border: '1px solid rgba(15,23,42,.06)',
  boxShadow: `0 10px 20px ${withAlpha(themeColor, 0.12)}`,
});

const requestBadge: React.CSSProperties = {
  minWidth: 24,
  height: 24,
  borderRadius: 999,
  background: '#0f172a',
  color: '#fff',
  display: 'inline-grid',
  placeItems: 'center',
  fontSize: 12,
  fontWeight: 700,
};

const requestCard: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  padding: '12px 12px',
  borderRadius: 14,
  background: '#f8fafc',
  border: '1px solid rgba(15,23,42,.06)',
};

const actionBtn = (themeColor: string): React.CSSProperties => ({
  padding: '8px 10px',
  borderRadius: 10,
  border: 'none',
  background: themeColor,
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
});

const ghostBtn: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 10,
  border: '1px solid #dbe1f0',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 700,
  cursor: 'pointer',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 10,
  border: '1px solid #dbe1f0',
  background: '#fff',
};

const fieldLabel: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#334155',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  resize: 'vertical',
  minHeight: 86,
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #dbe1f0',
  background: '#fff',
  fontFamily: 'inherit',
};

const hero = (themeColor: string): React.CSSProperties => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
  borderRadius: 28,
  padding: '20px 22px',
  background: `linear-gradient(135deg, ${tintColor(themeColor, 0.55)} 0%, #ffffff 90%)`,
  boxShadow: `0 22px 40px ${withAlpha(themeColor, 0.16)}`,
});

const heroTitle: React.CSSProperties = {
  margin: '4px 0 6px',
  fontSize: 28,
};

const heroText: React.CSSProperties = {
  margin: 0,
  color: '#334155',
};

const switchWrap: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
};

const switchBtn = (themeColor: string, active: boolean): React.CSSProperties => ({
  padding: '10px 14px',
  borderRadius: 999,
  border: active ? 'none' : '1px solid rgba(15,23,42,.08)',
  background: active ? themeColor : '#fff',
  color: active ? '#fff' : '#0f172a',
  fontWeight: 700,
  cursor: 'pointer',
});

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 16,
};

const panel: React.CSSProperties = {
  background: '#fff',
  borderRadius: 22,
  padding: 18,
  boxShadow: '0 12px 26px rgba(15,23,42,.08)',
  border: '1px solid rgba(15,23,42,.06)',
};

const sectionHeader: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
  border: 'none',
  background: 'transparent',
  padding: 0,
  cursor: 'pointer',
  textAlign: 'left',
};

const panelTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
};

const panelSummary: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#475569',
  lineHeight: 1.5,
};

const detailList: React.CSSProperties = {
  margin: '14px 0 0',
  paddingLeft: 18,
  color: '#334155',
  lineHeight: 1.7,
};

const historyCard = (themeColor: string): React.CSSProperties => ({
  display: 'grid',
  gap: 10,
  padding: '14px 16px',
  borderRadius: 18,
  background: `linear-gradient(180deg, #ffffff 0%, ${withAlpha(themeColor, 0.08)} 100%)`,
  border: '1px solid rgba(15,23,42,.06)',
});

const historyMeta: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  color: '#334155',
  fontSize: 13,
};
