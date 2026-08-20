import ResetPasswordClient from './ResetPasswordClient';

type ResetPasswordPageProps = {
  searchParams?: {
    token?: string;
  };
};

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const token = searchParams?.token?.trim() || '';
  return <ResetPasswordClient token={token} />;
}
