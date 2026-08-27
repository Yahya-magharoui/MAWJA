import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conditions générales d’utilisation | Kalymap',
  description: 'Conditions générales encadrant l’utilisation de l’application Kalymap.',
  alternates: { canonical: '/terms' },
  openGraph: {
    url: '/terms',
    title: 'Conditions générales d’utilisation | Kalymap',
    description: 'Conditions générales encadrant l’utilisation de l’application Kalymap.',
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
