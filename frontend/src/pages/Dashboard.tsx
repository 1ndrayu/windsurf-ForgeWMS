import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

type Good = { id: string; name: string; stock: number; location: string };
type Bin = { id: string; capacity: number; used: number };
type Audit = { id: string; ts: string; type: string; action: string; before?: any; after?: any };

const StatCard: React.FC<{ label: string; value: string; sub?: string; onClick?: () => void; actionLabel?: string; actionTo?: string; }> = ({ label, value, sub, onClick, actionLabel }) => (
  <motion.button
    type="button"
    onClick={onClick}
    className="text-left rounded-[14px] bg-[var(--color-elev)] p-5 border border-white/5 soft-shadow hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
  >
    <div className="text-[13px] md:text-[14px] uppercase tracking-wide font-semibold text-[var(--color-muted)]">{label}</div>
    <div className="mt-1 text-[28px] md:text-[32px] font-bold leading-tight">{value}</div>
    {sub && <div className="text-[12px] md:text-[13px] text-white/70 mt-1">{sub}</div>}
    {actionLabel && (
      <div className="mt-3">
        <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/20 px-3 py-1.5 text-[12px] text-[var(--color-accent)] hover:bg-black/30">
          {actionLabel}
        </span>
      </div>
    )}
  </motion.button>
);

const UtilBar: React.FC<{ pct: number }> = ({ pct }) => {
  const clamped = Math.min(100, Math.max(0, pct));
  const color = clamped > 80 ? 'var(--color-alert)' : clamped >= 50 ? 'var(--color-warn)' : 'var(--color-positive)';
  return (
    <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
      <div className="h-full" style={{ width: `${clamped}%`, background: color }} />
    </div>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [goods, setGoods] = React.useState<Good[]>([]);
  const [bins, setBins] = React.useState<Bin[]>([]);
  const [audit, setAudit] = React.useState<Audit[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showBins, setShowBins] = React.useState(true);
  const [showActivity, setShowActivity] = React.useState(true);

  const load = async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);
      const [g, b, a] = await Promise.all([
        fetch('/api/goods', { cache: 'no-store' }).then(r => r.json()),
        fetch('/api/storage-bins', { cache: 'no-store' }).then(r => r.json()),
        fetch('/api/audit?limit=10', { cache: 'no-store' }).then(r => r.json()),
      ]);
      setGoods(g);
      setBins(b);
      setAudit(a);
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  // Event-driven polling: check newest audit only, refresh silently when it changes
  React.useEffect(() => {
    let lastTsRef: string | null = null;
    let stop = false;
    const tick = async (): Promise<void> => {
      try {
        const latest = await fetch('/api/audit?limit=1', { cache: 'no-store' }).then(r => r.json());
        const newestTs: string | undefined = latest?.[0]?.ts;
        if (newestTs && lastTsRef && newestTs !== lastTsRef) {
          await load(true);
        }
        if (newestTs) lastTsRef = newestTs;
      } catch (e) {
        console.error(e);
      } finally {
        if (!stop) setTimeout(tick, 5000);
      }
    };
    tick();
    return () => { stop = true; };
  }, []);

  const lowStock = goods.filter(g => (Number(g.stock) || 0) < 10).length;
  const totalUnits = goods.reduce((s, g) => s + (Number(g.stock) || 0), 0);
  const usedCapacity = bins.reduce((s, b) => s + (Number(b.used) || 0), 0);

  const topBins = [...bins]
    .sort((a, b) => (b.used / b.capacity) - (a.used / a.capacity))
    .slice(0, 5);

  const relTime = (iso: string) => {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = Math.max(0, Math.floor((now - then) / 1000));
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const iconFor = (ev: Audit) => {
    if (ev.type === 'goods') {
      if (ev.action === 'create') return '➕';
      if (ev.action === 'update') return '✏️';
      if (ev.action === 'delete') return '🗑️';
    }
    if (ev.type === 'share') {
      if (ev.action === 'create') return '🔗';
      if (ev.action === 'delete') return '❌';
    }
    if (ev.type === 'storage' && ev.action === 'capacity') return '📦';
    return '•';
  };

  return (
    <div className="space-y-10 md:space-y-12">
      <div>
        <h2 className="text-[22px] md:text-[24px] font-semibold tracking-tight">Overview</h2>
        <p className="text-[13px] md:text-[14px] text-[var(--color-muted)] mt-1">Live insights from your goods and storage.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Goods Items" value={String(goods.length)} sub={`${totalUnits} total units`} onClick={() => navigate('/goods')} actionLabel="Add Item" />
        <StatCard label="Storage Bins" value={String(bins.length)} sub={`${usedCapacity} units placed`} onClick={() => navigate('/storage')} actionLabel="Manage" />
        <StatCard label="Low Stock" value={String(lowStock)} sub={'< 10 units'} onClick={() => navigate('/goods')} actionLabel="Review" />
        <StatCard label="Shares" value={audit.filter(a => a.type === 'share' && a.action === 'create').length.toString()} sub={'created recently'} onClick={() => navigate('/shares')} actionLabel="New Share" />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Top Utilized Bins */}
        <motion.div
          className="rounded-[14px] border border-white/5 bg-[var(--color-elev)] p-6 soft-shadow"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] uppercase tracking-wide font-semibold text-white/80">Top Utilized Bins</h3>
            <div className="flex items-center gap-3">
              <span className="hidden lg:inline text-[12px] text-white/50">capacity usage</span>
              <button
                type="button"
                className="lg:hidden text-[12px] px-2 py-1 rounded border border-white/10 hover:bg-white/5"
                onClick={() => setShowBins(v => !v)}
              >
                {showBins ? 'Collapse' : 'Expand'}
              </button>
            </div>
          </div>
          <div className={`mt-5 space-y-4 ${showBins ? 'block' : 'hidden'} lg:block`}>
            {loading && <div className="text-[13px] text-white/60">Loading…</div>}
            {!loading && topBins.length === 0 && <div className="text-[13px] text-white/60">No bins yet</div>}
            {!loading && topBins.map((b) => {
              const pct = Math.round((b.used / b.capacity) * 100);
              return (
                <div key={b.id} className="flex items-center gap-4">
                  <div className="w-20 text-[12px] font-medium text-white/70">{b.id}</div>
                  <div className="flex-1"><UtilBar pct={pct} /></div>
                  <div className="w-12 text-right text-[12px] text-white/70">{pct}%</div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          className="rounded-[14px] border border-white/5 bg-[var(--color-elev)] p-6 soft-shadow"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] uppercase tracking-wide font-semibold text-white/80">Recent Activity</h3>
            <button
              type="button"
              className="lg:hidden text-[12px] px-2 py-1 rounded border border-white/10 hover:bg-white/5"
              onClick={() => setShowActivity(v => !v)}
            >
              {showActivity ? 'Collapse' : 'Expand'}
            </button>
          </div>
          <ul className={`mt-4 divide-y divide-white/5 ${showActivity ? 'block' : 'hidden'} lg:block`}>
            {loading && <li className="py-2 text-[13px] text-white/60">Loading…</li>}
            {!loading && audit.length === 0 && <li className="py-2 text-[13px] text-white/60">No recent events</li>}
            {!loading && audit.map(ev => (
              <li key={ev.id} className="py-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-[16px]" aria-hidden>{iconFor(ev)}</span>
                  <span className="text-[13px] text-white/80">
                    {ev.type === 'goods' && ev.action === 'create' && <>Added <span className="font-medium">{ev.after?.id || ''}</span> (<span className="text-white/70">{ev.after?.name || ''}</span>)</>}
                    {ev.type === 'goods' && ev.action === 'update' && <>Updated <span className="font-medium">{ev.after?.id || ev.before?.id}</span></>}
                    {ev.type === 'goods' && ev.action === 'delete' && <>Deleted <span className="font-medium">{ev.before?.id}</span></>}
                    {ev.type === 'share' && ev.action === 'create' && <>Created access window <span className="font-medium">{ev.after?.name}</span></>}
                    {ev.type === 'share' && ev.action === 'delete' && <>Deleted access window <span className="font-medium">{ev.before?.name}</span></>}
                    {ev.type === 'storage' && ev.action === 'capacity' && <>Updated capacity for bin <span className="font-medium">{ev.after?.id}</span> to <span className="font-medium">{ev.after?.capacity}</span></>}
                  </span>
                </div>
                <span className="text-[12px] text-white/50" title={new Date(ev.ts).toLocaleString()}>{relTime(ev.ts)}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Mobile collapsible sections (progressive disclosure) */}
      <div className="lg:hidden text-center text-white/40 text-xs">Sections above are responsive and stack on mobile. Charts and lists resize proportionally.</div>
    </div>
  );
};

export default Dashboard;
