'use client';

import type { SessionProfile } from './session';

export type DoctorDirectoryEntry = {
  id: string;
  code: string;
  name: string;
  email: string;
  specialty: string;
};

export type AssignmentStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export type DoctorAssignmentRequest = {
  id: string;
  patientUserId: string;
  patientName: string;
  patientEmail: string;
  requestedDoctorId: string;
  requestedDoctorCode: string;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
  reviewedByDoctorId?: string | null;
  transferHistory?: Array<{
    fromDoctorId: string;
    toDoctorId: string;
    at: string;
  }>;
  rejectionReason?: string | null;
};

const ASSIGNMENT_STORAGE_KEY = 'mawja-doctor-assignment-requests';

const DOCTORS: DoctorDirectoryEntry[] = [
  {
    id: 'doctor-1',
    code: 'DOC-SARAH',
    name: 'Dr. Sarah Benali',
    email: 'doctor@example.com',
    specialty: 'Psychotraumatologie',
  },
  {
    id: 'doctor-2',
    code: 'DOC-NADIA',
    name: 'Dr. Nadia Laurent',
    email: 'nadia@example.com',
    specialty: 'TCC',
  },
  {
    id: 'doctor-3',
    code: 'DOC-OMAR',
    name: 'Dr. Omar Fares',
    email: 'omar@example.com',
    specialty: 'Addictologie',
  },
];

function readRequests() {
  if (typeof window === 'undefined') return [] as DoctorAssignmentRequest[];

  try {
    const raw = window.localStorage.getItem(ASSIGNMENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DoctorAssignmentRequest[]) : [];
  } catch {
    return [];
  }
}

function writeRequests(requests: DoctorAssignmentRequest[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ASSIGNMENT_STORAGE_KEY, JSON.stringify(requests));
}

function ensurePatientIdentity(profile: SessionProfile | null) {
  const rawId = profile?.id;
  const fallbackId = profile?.email ?? `guest-${Date.now()}`;
  return {
    patientUserId: rawId != null ? String(rawId) : fallbackId,
    patientName: profile?.name?.trim() || profile?.email?.split('@')[0] || 'Patient sans nom',
    patientEmail: profile?.email ?? 'patient@example.com',
  };
}

export function getDoctorDirectory() {
  return DOCTORS;
}

export function getDoctorByCode(code: string) {
  const normalized = code.trim().toUpperCase();
  return DOCTORS.find((doctor) => doctor.code.toUpperCase() === normalized) ?? null;
}

export function getDoctorById(id: string) {
  return DOCTORS.find((doctor) => doctor.id === id) ?? null;
}

export function getDoctorForProfile(profile: SessionProfile | null) {
  if (!profile?.email) return null;
  return DOCTORS.find((doctor) => doctor.email.toLowerCase() === profile.email?.toLowerCase()) ?? null;
}

export async function fetchPatientAssignmentStatus(profile: SessionProfile | null) {
  const { patientUserId } = ensurePatientIdentity(profile);
  const requests = readRequests().filter((request) => request.patientUserId === patientUserId);
  return requests.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] ?? null;
}

export async function submitAssignmentRequest(profile: SessionProfile | null, doctorCode: string) {
  const doctor = getDoctorByCode(doctorCode);
  if (!doctor) {
    throw new Error('Code médecin introuvable.');
  }

  const { patientUserId, patientName, patientEmail } = ensurePatientIdentity(profile);
  const requests = readRequests();
  const existingIndex = requests.findIndex(
    (request) => request.patientUserId === patientUserId && request.status === 'PENDING'
  );
  const now = new Date().toISOString();

  const nextRequest: DoctorAssignmentRequest = {
    id: existingIndex >= 0 ? requests[existingIndex].id : `assignment-${Math.random().toString(36).slice(2, 10)}`,
    patientUserId,
    patientName,
    patientEmail,
    requestedDoctorId: doctor.id,
    requestedDoctorCode: doctor.code,
    status: 'PENDING',
    createdAt: existingIndex >= 0 ? requests[existingIndex].createdAt : now,
    updatedAt: now,
    reviewedByDoctorId: null,
    transferHistory: existingIndex >= 0 ? requests[existingIndex].transferHistory ?? [] : [],
    rejectionReason: null,
  };

  if (existingIndex >= 0) {
    requests[existingIndex] = nextRequest;
  } else {
    requests.unshift(nextRequest);
  }

  writeRequests(requests);
  return nextRequest;
}

export async function fetchDoctorAssignmentRequests(doctorId: string) {
  return readRequests()
    .filter((request) => request.requestedDoctorId === doctorId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function acceptAssignmentRequest(requestId: string, doctorId: string) {
  const requests = readRequests();
  const next = requests.map((request) =>
    request.id === requestId
      ? {
          ...request,
          status: 'ACCEPTED' as const,
          updatedAt: new Date().toISOString(),
          reviewedByDoctorId: doctorId,
          rejectionReason: null,
        }
      : request
  );
  writeRequests(next);
}

export async function rejectAssignmentRequest(requestId: string, doctorId: string, reason?: string) {
  const requests = readRequests();
  const next = requests.map((request) =>
    request.id === requestId
      ? {
          ...request,
          status: 'REJECTED' as const,
          updatedAt: new Date().toISOString(),
          reviewedByDoctorId: doctorId,
          rejectionReason: reason?.trim() || null,
        }
      : request
  );
  writeRequests(next);
}

export async function transferAssignmentRequest(requestId: string, fromDoctorId: string, toDoctorId: string) {
  const nextDoctor = getDoctorById(toDoctorId);
  if (!nextDoctor) throw new Error('Médecin de transfert introuvable.');

  const requests = readRequests();
  const now = new Date().toISOString();
  const next = requests.map((request) =>
    request.id === requestId
      ? {
          ...request,
          requestedDoctorId: toDoctorId,
          requestedDoctorCode: nextDoctor.code,
          status: 'PENDING' as const,
          updatedAt: now,
          reviewedByDoctorId: fromDoctorId,
          transferHistory: [...(request.transferHistory ?? []), { fromDoctorId, toDoctorId, at: now }],
          rejectionReason: null,
        }
      : request
  );
  writeRequests(next);
}
