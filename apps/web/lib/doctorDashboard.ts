'use client';

export type DoctorPatientProfileSection = {
  id: string;
  label: string;
  summary: string;
  details: string[];
};

export type DoctorPatientHistoryEntry = {
  id: string;
  label: string;
  time: string;
  stateChange: string;
  exercisesCount: number;
  duration: string;
  notes: string;
};

export type DoctorPatientHistoryGroup = {
  id: string;
  label: string;
  entries: DoctorPatientHistoryEntry[];
};

export type DoctorPatientSummary = {
  id: string;
  name: string;
  age: number;
  currentSituation: string;
  lastActivity: string;
  sections: DoctorPatientProfileSection[];
  historyGroups: DoctorPatientHistoryGroup[];
};

export type DoctorDashboardData = {
  doctor: {
    id: string;
    name: string;
    specialty: string;
  };
  patients: DoctorPatientSummary[];
};

const MOCK_DATA: DoctorDashboardData = {
  doctor: {
    id: 'doctor-1',
    name: 'Dr. Sarah Benali',
    specialty: 'Psychotraumatologie',
  },
  patients: [
    {
      id: 'patient-1',
      name: 'Andre Tolin',
      age: 34,
      currentSituation: 'Hyperactivation moderee ces derniers jours, reprise des exercices d ancrage.',
      lastActivity: 'Aujourd hui a 09:42',
      sections: [
        {
          id: 'identity',
          label: 'Informations du patient',
          summary: 'Patient suivi depuis 3 mois, rythme de connexion regulier.',
          details: ['Age : 34 ans', 'Suivi hebdomadaire', 'Objectif actuel : retrouver une routine stable'],
        },
        {
          id: 'safe-place',
          label: 'Lieux surs du patient',
          summary: 'Deux lieux surs renseignes et revisites frequemment.',
          details: ['Foret en bord de lac', 'Chambre avec musique douce'],
        },
        {
          id: 'goals',
          label: 'Goals du patient',
          summary: 'Travaille surtout la respiration et les reperes corporels.',
          details: ['Pratiquer la coherence 5 min / jour', 'Identifier une emotion par jour'],
        },
        {
          id: 'top-exercises',
          label: 'Exercices les plus consultes',
          summary: 'Les SBA et la respiration sont les plus utilises.',
          details: ['SBA visuelles', 'Respiration coherence', 'Ancrage 5-4-3-2-1'],
        },
        {
          id: 'favorites',
          label: 'Favoris',
          summary: 'Routine courte orientee retour au calme.',
          details: ['Safe place', 'Audio ocean', 'Respiration abdominale'],
        },
      ],
      historyGroups: [
        {
          id: 'today',
          label: 'Aujourd hui',
          entries: [
            {
              id: 'c1',
              label: 'Connexion 1',
              time: '09:42',
              stateChange: 'Hyper -> Tolerance',
              exercisesCount: 3,
              duration: '18 min',
              notes: 'Emotion finalisee : Joie / Heureux / Inspire',
            },
            {
              id: 'c2',
              label: 'Connexion 2',
              time: '07:58',
              stateChange: 'Hyper -> Hypo',
              exercisesCount: 1,
              duration: '6 min',
              notes: 'Arret rapide apres un exercice SBA tactile',
            },
          ],
        },
        {
          id: 'week',
          label: 'Cette semaine',
          entries: [
            {
              id: 'w1',
              label: 'Connexion 5',
              time: 'Lun. 18:20',
              stateChange: 'Hypo -> Tolerance',
              exercisesCount: 4,
              duration: '25 min',
              notes: 'Utilisation reguliere du lieu sur',
            },
          ],
        },
        {
          id: 'older',
          label: 'Autres',
          entries: [
            {
              id: 'o1',
              label: 'Connexion 12',
              time: '02 avr. 14:10',
              stateChange: 'Hyper -> Tolerance',
              exercisesCount: 2,
              duration: '11 min',
              notes: 'Sequence breve de respiration et ancrage',
            },
          ],
        },
      ],
    },
    {
      id: 'patient-2',
      name: 'Lina Moreau',
      age: 28,
      currentSituation: 'Bonne stabilite generale, quelques pics d anxiete en fin de journee.',
      lastActivity: 'Hier a 21:15',
      sections: [
        {
          id: 'identity',
          label: 'Informations du patient',
          summary: 'Suivi recent, bonne adherence aux check-ins.',
          details: ['Age : 28 ans', 'Suivi bi-mensuel', 'Objectif : prevenir les episodes de surcharge'],
        },
        {
          id: 'safe-place',
          label: 'Lieux surs du patient',
          summary: 'Lieu sur principalement sonore et visuel.',
          details: ['Terrasse ensoleillee', 'Bruit de pluie en fond'],
        },
        {
          id: 'goals',
          label: 'Goals du patient',
          summary: 'Objectifs axes sur l anticipation des signaux corporels.',
          details: ['Identifier le basculement en hyper', 'Noter 3 signaux precoces'],
        },
        {
          id: 'top-exercises',
          label: 'Exercices les plus consultes',
          summary: 'Les audios et le safe place dominent.',
          details: ['Audio pluie', 'Lieu sur', 'Roue des emotions'],
        },
        {
          id: 'favorites',
          label: 'Favoris',
          summary: 'Bibliotheque tres courte, usage cible.',
          details: ['Audio birds', 'Lieu sur'],
        },
      ],
      historyGroups: [
        {
          id: 'today',
          label: 'Aujourd hui',
          entries: [],
        },
        {
          id: 'week',
          label: 'Cette semaine',
          entries: [
            {
              id: 'lw1',
              label: 'Connexion 2',
              time: 'Mar. 21:15',
              stateChange: 'Hyper -> Tolerance',
              exercisesCount: 2,
              duration: '14 min',
              notes: 'Amelioration apres audio rythme',
            },
          ],
        },
        {
          id: 'older',
          label: 'Autres',
          entries: [
            {
              id: 'lo1',
              label: 'Connexion 9',
              time: '29 mars 10:05',
              stateChange: 'Hypo -> Tolerance',
              exercisesCount: 3,
              duration: '17 min',
              notes: 'Retour progressif via stimulation sensorielle',
            },
          ],
        },
      ],
    },
  ],
};

// Future API target: GET /api/doctors/me/dashboard
export async function fetchDoctorDashboard(): Promise<DoctorDashboardData> {
  return Promise.resolve(MOCK_DATA);
}

// Future API target: GET /api/doctors/me/patients/:patientId
export async function fetchDoctorPatient(patientId: string): Promise<DoctorPatientSummary | null> {
  return Promise.resolve(MOCK_DATA.patients.find((patient) => patient.id === patientId) ?? null);
}
