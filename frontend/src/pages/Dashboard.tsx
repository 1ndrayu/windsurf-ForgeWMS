import React from 'react';
import { motion } from 'framer-motion';

type Good = { id: string; name: string; stock: number; location: string };
type Bin = { id: string; capacity: number; used: number };
type Audit = { id: string; ts: string; type: string; action: string; before?: any; after?: any };

const StatCard: React.FC<{ label: string; value: string; sub?: string; }> = ({ label, value, sub }) => (
  <motion.div
    className="rounded-lg bg-[var(--color-elev)] p-4 border border-white/5"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{label}</div>
    <div className="mt-1 text-2xl font-semibold">{value}</div>
    {sub && <div className="text-xs text-white/60 mt-1">{sub}</div>}
  </motion.div>
);

const Bar: React.FC<{ pct: number }> = ({ pct }) => (
  <div className="h-2 w-full rounded bg-white/10 overflow-hidden">
    <div className="h-full bg-[var(--color-accent)]" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
  </div>
);

const Dashboard: React.FC = () => {
  const [goods, setGoods] = React.useState<Good[]>([]);
  const [bins, setBins] = React.useState<Bin[]>([]);
  const [audit, setAudit] = React.useState<Audit[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [g, b, a] = await Promise.all([
        fetch('/api/goods').then(r => r.json()),
        fetch('/api/storage-bins').then(r => r.json()),
        fetch('/api/audit?limit=10').then(r => r.json()),
      ]);
      setGoods(g);
      setBins(b);
      setAudit(a);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const lowStock = goods.filter(g => (Number(g.stock) || 0) < 10).length;
  const totalUnits = goods.reduce((s, g) => s + (Number(g.stock) || 0), 0);
  const usedCapacity = bins.reduce((s, b) => s + (Number(b.used) || 0), 0);

  const topBins = [...bins]
    .sort((a, b) => (b.used / b.capacity) - (a.used / a.capacity))
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
        <p className="text-sm text-[var(--color-muted)] mt-1">Live insights from your goods and storage.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Goods Items" value={String(goods.length)} sub={`${totalUnits} total units`} />
        <StatCard label="Storage Bins" value={String(bins.length)} sub={`${usedCapacity} units placed`} />
        <StatCard label="Low Stock" value={String(lowStock)} sub={'< 10 units'} />
        <StatCard label="Shares" value={audit.filter(a => a.type === 'share' && a.action === 'create').length.toString()} sub={'created recently'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          className="rounded-xl border border-white/5 bg-[var(--color-elev)] p-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white/80">Top Utilized Bins</h3>
            <span className="text-xs text-white/50">capacity usage</span>
          </div>
          <div className="mt-4 space-y-3">
            {loading && <div className="text-sm text-white/60">Loading…</div>}
            {!loading && topBins.length === 0 && <div className="text-sm text-white/60">No bins yet</div>}
            {!loading && topBins.map((b, i) => {
              const pct = Math.round((b.used / b.capacity) * 100);
              return (
                <div key={b.id} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-white/70">{b.id}</div>
                  <Bar pct={pct} />
                  <div className="w-12 text-right text-xs text-white/70">{pct}%</div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          className="rounded-xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h3 className="text-sm font-medium text-white/80">Recent Activity</h3>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            {loading && <li>Loading…</li>}
            {!loading && audit.length === 0 && <li>No recent events</li>}
            {!loading && audit.map(ev => (
              <li key={ev.id} className="flex items-center justify-between">
                <span>
                  {ev.type === 'goods' && ev.action === 'create' && `Added ${ev.after?.id || ''} (${ev.after?.name || ''})`}
                  {ev.type === 'goods' && ev.action === 'update' && `Updated ${ev.after?.id || ev.before?.id}`}
                  {ev.type === 'goods' && ev.action === 'delete' && `Deleted ${ev.before?.id}`}
                  {ev.type === 'share' && ev.action === 'create' && `Created access window ${ev.after?.name}`}
                  {ev.type === 'share' && ev.action === 'delete' && `Deleted access window ${ev.before?.name}`}
                </span>
                <span className="text-xs text-white/50">{new Date(ev.ts).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
