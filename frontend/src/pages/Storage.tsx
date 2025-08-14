import React from 'react';
import { motion } from 'framer-motion';

type Bin = { id: string; capacity: number; used: number };

const Storage: React.FC = () => {
  const readOnly = typeof window !== 'undefined' && window.location.pathname.startsWith('/share/');
  const [bins, setBins] = React.useState<Bin[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [newCap, setNewCap] = React.useState<string>('');

  const load = () => {
    setLoading(true);
    fetch('/api/storage-bins')
      .then(r => r.json())
      .then(setBins)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    load();
  }, []);

  const startEdit = (b: Bin) => {
    setEditing(b.id);
    setNewCap(String(b.capacity));
  };

  const cancelEdit = () => {
    setEditing(null);
    setNewCap('');
  };

  const saveEdit = async (id: string) => {
    const cap = Number(newCap);
    if (!Number.isFinite(cap) || cap <= 0) {
      alert('Capacity must be a positive number');
      return;
    }
    try {
      await fetch(`/api/storage-bins/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capacity: cap }),
      });
      cancelEdit();
      load();
    } catch (e) {
      console.error(e);
      alert('Failed to update capacity');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Storage</h2>
        <p className="text-sm text-[var(--color-muted)] mt-1">Rack bins and capacity utilization.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading && (
          <div className="text-sm text-white/60">Loading…</div>
        )}
        {!loading && bins.map((bin, idx) => {
          const pct = Math.round((bin.used / bin.capacity) * 100);
          const isEditing = editing === bin.id;
          return (
            <motion.div
              key={bin.id}
              className="rounded-lg border border-white/5 bg-[var(--color-elev)] p-4"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.03 }}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Bin {bin.id}</div>
                {!isEditing && (
                  <div className="text-xs text-[var(--color-muted)]">{bin.used}/{bin.capacity}</div>
                )}
              </div>
              <div className="mt-3 h-2 rounded bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-[var(--color-accent)]"
                  style={{ width: `${pct}%` }}
                />
              </div>

              {!readOnly && (
                <div className="mt-3 flex items-center justify-between gap-2">
                  {!isEditing ? (
                    <button
                      className="text-xs text-[var(--color-accent)] hover:underline"
                      onClick={() => startEdit(bin)}
                    >
                      Edit Capacity
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="number"
                        min={1}
                        value={newCap}
                        onChange={e => setNewCap(e.target.value)}
                        className="w-full rounded bg-black/40 px-2 py-1 text-xs border border-white/10 focus:outline-none"
                      />
                      <button
                        className="text-xs px-2 py-1 rounded bg-[var(--color-accent)] text-black"
                        onClick={() => saveEdit(bin.id)}
                      >
                        Save
                      </button>
                      <button
                        className="text-xs text-white/70 hover:underline"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Storage;
