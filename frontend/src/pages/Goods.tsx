import React from 'react';
import { motion } from 'framer-motion';

type Good = { id: string; name: string; stock: number; location: string };

const Goods: React.FC = () => {
  const readOnly = typeof window !== 'undefined' && window.location.pathname.startsWith('/share/');
  const [items, setItems] = React.useState<Good[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAdd, setShowAdd] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);
  const [sku, setSku] = React.useState('');
  const [name, setName] = React.useState('');
  const [stock, setStock] = React.useState<number>(0);
  const [location, setLocation] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const loadGoods = () => {
    setLoading(true);
    fetch('/api/goods')
      .then(r => r.json())
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    loadGoods();
  }, []);

  const handleCreate = async () => {
    if (readOnly) return;
    if (!sku.trim() || !name.trim()) {
      alert('SKU and Name are required');
      return;
    }
    try {
      const res = await fetch('/api/goods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sku.trim(), name: name.trim(), stock, location: location.trim() }),
      });
      if (!res.ok) throw new Error('Failed to create item');
      // Reset form and refresh list
      setSku('');
      setName('');
      setStock(0);
      setLocation('');
      setShowAdd(false);
      loadGoods();
    } catch (e) {
      console.error(e);
      alert('Could not create item');
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    if (!window.confirm('Delete this item? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/goods/${encodeURIComponent(editingId)}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete item');
      setShowEdit(false);
      setEditingId(null);
      loadGoods();
    } catch (e) {
      console.error(e);
      alert('Could not delete item');
    }
  };

  const openEdit = (g: Good) => {
    setEditingId(g.id);
    setSku(g.id);
    setName(g.name);
    setStock(g.stock);
    setLocation(g.location);
    setShowEdit(true);
  };

  const handleUpdate = async () => {
    if (readOnly) return;
    if (!editingId) return;
    if (!sku.trim() || !name.trim()) {
      alert('SKU and Name are required');
      return;
    }
    try {
      const res = await fetch(`/api/goods/${encodeURIComponent(editingId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sku.trim(), name: name.trim(), stock, location: location.trim() }),
      });
      if (!res.ok) throw new Error('Failed to update item');
      // Close and refresh
      setShowEdit(false);
      setEditingId(null);
      loadGoods();
    } catch (e) {
      console.error(e);
      alert('Could not update item');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Goods</h2>
          <p className="text-sm text-[var(--color-muted)] mt-1">Catalog of SKUs and stock levels.</p>
        </div>
        {!readOnly && (
          <button onClick={() => setShowAdd(true)} className="rounded-md bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-black hover:brightness-110 transition">
            Add Item
          </button>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[var(--color-elev)] p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Add Item</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-white/70 mb-1">SKU</label>
                <input value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g., SKU-AX12" className="w-full rounded-md bg-black/30 px-3 py-2 text-sm outline-none border border-white/10 focus:border-[var(--color-accent)]" />
              </div>
              <div>
                <label className="block text-xs text-white/70 mb-1">Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Item name" className="w-full rounded-md bg-black/30 px-3 py-2 text-sm outline-none border border-white/10 focus:border-[var(--color-accent)]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/70 mb-1">Stock</label>
                  <input type="number" value={stock} onChange={e => setStock(Number(e.target.value))} className="w-full rounded-md bg-black/30 px-3 py-2 text-sm outline-none border border-white/10 focus:border-[var(--color-accent)]" />
                </div>
                <div>
                  <label className="block text-xs text-white/70 mb-1">Location</label>
                  <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g., A-1" className="w-full rounded-md bg-black/30 px-3 py-2 text-sm outline-none border border-white/10 focus:border-[var(--color-accent)]" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="rounded-md px-3 py-2 text-sm text-white/80 hover:text-white" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="rounded-md bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-black hover:brightness-110" onClick={handleCreate}>Create</button>
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[var(--color-elev)] p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Edit Item</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-white/70 mb-1">SKU</label>
                <input value={sku} onChange={e => setSku(e.target.value)} className="w-full rounded-md bg-black/30 px-3 py-2 text-sm outline-none border border-white/10 focus:border-[var(--color-accent)]" />
              </div>
              <div>
                <label className="block text-xs text-white/70 mb-1">Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-md bg-black/30 px-3 py-2 text-sm outline-none border border-white/10 focus:border-[var(--color-accent)]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/70 mb-1">Stock</label>
                  <input type="number" value={stock} onChange={e => setStock(Number(e.target.value))} className="w-full rounded-md bg-black/30 px-3 py-2 text-sm outline-none border border-white/10 focus:border-[var(--color-accent)]" />
                </div>
                <div>
                  <label className="block text-xs text-white/70 mb-1">Location</label>
                  <input value={location} onChange={e => setLocation(e.target.value)} className="w-full rounded-md bg-black/30 px-3 py-2 text-sm outline-none border border-white/10 focus:border-[var(--color-accent)]" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-between gap-3">
              <button className="rounded-md px-3 py-2 text-sm text-red-400 hover:text-red-300" onClick={handleDelete}>Delete Item</button>
              <div className="flex gap-3">
                <button className="rounded-md px-3 py-2 text-sm text-white/80 hover:text-white" onClick={() => setShowEdit(false)}>Cancel</button>
                <button className="rounded-md bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-black hover:brightness-110" onClick={handleUpdate}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-white/5">
        <div className="grid grid-cols-5 bg-white/5 text-xs uppercase tracking-wide text-white/70">
          <div className="px-3 py-2">SKU</div>
          <div className="px-3 py-2">Name</div>
          <div className="px-3 py-2">Stock</div>
          <div className="px-3 py-2">Location</div>
          <div className="px-3 py-2 text-right">Actions</div>
        </div>
        {loading && (
          <div className="px-3 py-4 text-sm text-white/60">Loading…</div>
        )}
        {!loading && items.map((g, i) => (
          <motion.div
            key={g.id}
            className="grid grid-cols-5 items-center bg-[var(--color-elev)]/60 hover:bg-[var(--color-elev)] transition border-t border-white/5"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.03 }}
          >
            <div className="px-3 py-3 text-sm font-mono">{g.id}</div>
            <div className="px-3 py-3 text-sm">{g.name}</div>
            <div className="px-3 py-3 text-sm">{g.stock}</div>
            <div className="px-3 py-3 text-sm">{g.location}</div>
            <div className="px-3 py-3 text-sm text-right">
              {!readOnly && (
                <button className="text-[var(--color-accent)] hover:underline" onClick={() => openEdit(g)}>Edit</button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Goods;
