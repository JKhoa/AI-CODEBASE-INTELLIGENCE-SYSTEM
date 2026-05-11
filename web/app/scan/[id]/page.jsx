import Scan from '@/src/components/pages/Scan';

export default function ScanPage({ params }) {
  return <Scan sessionId={params.id}/>;
}
