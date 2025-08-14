import React from 'react';
import { motion } from 'framer-motion';

type Share = { id: string; name: string; scope?: string; url: string; access: string };

const Shares: React.FC = () => {
  const [rows, setRows] = React.useState<Share[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showNew, setShowNew] = React.useState(false);
  const [name, setName] = React.useState('');
  const [scope, setScope] = React.useState('');
  const [createdUrl, setCreatedUrl] = React.useState<string>('');
  const [copiedRowId, setCopiedRowId] = React.useState<string | null>(null);
  const [copiedCreated, setCopiedCreated] = React.useState<boolean>(false);

  const loadShares = () => {
    setLoading(true);
    fetch('/api/shares')
      .then(r => r.json())
      .then(setRows)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    loadShares();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('Name is required');
      return;
    }
    try {
      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), scope: scope.trim() || undefined }),
      });
      if (!res.ok) throw new Error('Failed to create share');
      const data: Share = await res.json();
      setCreatedUrl(window.location.origin + data.url);
      setName('');
      setScope('');
      setShowNew(false);
      loadShares();
    } catch (e) {
      console.error(e);
      alert('Could not create share');
    }
  };

  const handleDeleteRow = async (row: Share) => {
    if (!window.confirm(`Delete access window "${row.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/shares/${encodeURIComponent(row.id)}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete');
      loadShares();
    } catch (e) {
      console.error(e);
      alert('Could not delete');
    }
  };

  const copyText = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {
      // fall through to fallback
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-1000px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      console.error('Copy failed', e);
      return false;
    }
  };

  const handleCopyRow = async (row: Share) => {
    const full = window.location.origin + row.url;
    const ok = await copyText(full);
    if (ok) {
      setCopiedRowId(row.id);
      setTimeout(() => setCopiedRowId(prev => (prev === row.id ? null : prev)), 1500);
    } else {
      alert('Failed to copy');
    }
  };

  const handleCopyCreated = async () => {
    const ok = await copyText(createdUrl);
    if (ok) {
      setCopiedCreated(true);
      setTimeout(() => setCopiedCreated(false), 1500);
    } else {
      alert('Failed to copy');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Access Windows</h2>
          <p className="text-sm text-[var(--color-muted)] mt-1">Create and manage access windows for vendors and stakeholders.</p>
        </div>
        <button onClick={() => setShowNew(true)} className="rounded-md bg-[var(--color-accent-2)] px-3 py-2 text-sm font-medium text-black hover:brightness-110 transition">
          New Access Window
        </button>
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[var(--color-elev)] p-6 shadow-lg">
            <h3 className="text-lg font-semibold">New Access Window</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-white/70 mb-1">Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Vendor Inventory"
                  className="w-full rounded-md bg-black/30 px-3 py-2 text-sm outline-none border border-white/10 focus:border-[var(--color-accent-2)]" />
              </div>
              <div>
                <label className="block text-xs text-white/70 mb-1">Scope (optional)</label>
                <input value={scope} onChange={e => setScope(e.target.value)} placeholder="Describe what the access includes"
                  className="w-full rounded-md bg-black/30 px-3 py-2 text-sm outline-none border border-white/10 focus:border-[var(--color-accent-2)]" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="rounded-md px-3 py-2 text-sm text-white/80 hover:text-white" onClick={() => setShowNew(false)}>Cancel</button>
              <button className="rounded-md bg-[var(--color-accent-2)] px-3 py-2 text-sm font-medium text-black hover:brightness-110" onClick={handleCreate}>Create</button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-white/5">
        <div className="grid grid-cols-5 bg-white/5 text-xs uppercase tracking-wide text-white/70">
          <div className="px-3 py-2">Name</div>
          <div className="px-3 py-2">Scope</div>
          <div className="px-3 py-2">URL</div>
          <div className="px-3 py-2">Access</div>
          <div className="px-3 py-2 text-right">Actions</div>
        </div>
        {loading && <div className="px-3 py-4 text-sm text-white/60">Loading…</div>}
        {!loading && rows.map((row, i) => (
          <motion.div
            key={row.id}
            className="grid grid-cols-5 items-center bg-[var(--color-elev)]/60 hover:bg-[var(--color-elev)] transition border-t border-white/5"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.04 }}
          >
            <div className="px-3 py-3 text-sm">{row.name}</div>
            <div className="px-3 py-3 text-sm">{row.scope || '-'}</div>
            <div className="px-3 py-3 text-sm text-[var(--color-accent)] truncate">{row.url}</div>
            <div className="px-3 py-3 text-sm">{row.access}</div>
            <div className="px-3 py-3 text-sm text-right space-x-4">
              <button className="text-[var(--color-accent)] hover:underline" onClick={() => handleCopyRow(row)}>{copiedRowId === row.id ? 'Copied!' : 'Copy Link'}</button>
              <button className="text-red-400 hover:underline" onClick={() => handleDeleteRow(row)}>Delete</button>
            </div>
          </motion.div>
        ))}
      </div>

      {createdUrl && (
        <div className="mt-4 rounded-lg border border-white/10 bg-[var(--color-elev)] p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="truncate"><span className="text-white/70">Created: </span><span className="text-[var(--color-accent)]">{createdUrl}</span></div>
            <button className="text-[var(--color-accent)] hover:underline" onClick={handleCopyCreated}>{copiedCreated ? 'Copied!' : 'Copy'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shares;
