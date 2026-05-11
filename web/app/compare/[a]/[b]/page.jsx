import Compare from '@/src/components/pages/Compare';

export default function ComparePage({ params }) {
  return <Compare a={params.a} b={params.b}/>;
}
