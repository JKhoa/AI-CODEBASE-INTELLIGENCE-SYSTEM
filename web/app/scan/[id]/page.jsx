import Scan from '@/src/components/pages/Scan';

export default function ScanPage({ params, searchParams }) {
  return <Scan sessionId={params.id} urlParams={searchParams} />;
}
