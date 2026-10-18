export default function Skeleton({ height = 140 }) {
  return <div aria-busy="true" style={{ height }} className="animate-pulse rounded-2xl bg-slate-200" />;
}
