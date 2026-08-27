import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité | Kalymap',
  description: 'Politique de confidentialité et informations relatives aux données personnelles traitées par Kalymap.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    url: '/privacy',
    title: 'Politique de confidentialité | Kalymap',
    description: 'Politique de confidentialité et informations relatives aux données personnelles traitées par Kalymap.',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
