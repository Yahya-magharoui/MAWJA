'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchDoctorDashboard, type DoctorDashboardData, type DoctorPatientSummary } from '../lib/doctorDashboard';
import { tintColor, withAlpha } from './theme';

type Props = {
  themeColor: string;
};

type DoctorView = 'profile' | 'history';

export default function DoctorDashboard({ themeColor }: Props) {
  const [data, setData] = useState<DoctorDashboardData | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<DoctorView>('profile');
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const response = await fetchDoctorDashboard();
      if (cancelled) return;
      setData(response);
      setSelectedPatientId(response.patients[0]?.id ?? null);
      setExpandedSectionId(response.patients[0]?.sections[0]?.id ?? null);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedPatient = useMemo<DoctorPatientSummary | null>(
    () => data?.patients.find((patient) => patient.id === selectedPatientId) ?? null,
    [data, selectedPatientId]
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
          {data.patients.map((patient) => {
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
            <p style={eyebrow}>Patient selectionne</p>
            <h2 style={heroTitle}>{selectedPatient.name}</h2>
            <p style={heroText}>
              {selectedPatient.age} ans · {selectedPatient.currentSituation}
            </p>
          </div>
          <div style={switchWrap}>
            <button type="button" onClick={() => setActiveView('profile')} style={switchBtn(themeColor, activeView === 'profile')}>
              Profil
            </button>
            <button type="button" onClick={() => setActiveView('history')} style={switchBtn(themeColor, activeView === 'history')}>
              Historique
            </button>
          </div>
        </header>

        {activeView === 'profile' ? (
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
