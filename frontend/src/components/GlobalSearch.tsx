import React from 'react';

type Result = {
  goods: Array<{ id: string; name: string; stock: number; location: string }>;
  bins: Array<{ id: string; capacity: number; used: number }>;
};

export const GlobalSearch: React.FC = () => {
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [res, setRes] = React.useState<Result | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  React.useEffect(() => {
    if (!q.trim()) {
      setRes(null);
      return;
    }
    const id = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' })
        .then(r => r.json())
        .then(setRes)
        .catch(() => setRes(null));
    }, 200);
    return () => clearTimeout(id);
  }, [q]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={q}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={e => setQ(e.target.value)}
        className="w-72 md:w-80 rounded-md bg-white/5 px-3 py-2 text-sm placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        placeholder="Search goods, bins…  (Ctrl/Cmd+K)"
      />
      {open && res && (res.goods.length || res.bins.length) ? (
        <div className="absolute right-0 mt-2 z-20 w-[28rem] max-w-[80vw] rounded-[12px] bg-[var(--color-elev)] border border-white/10 soft-shadow p-2">
          <div className="max-h-80 overflow-auto divide-y divide-white/5">
            {res.goods.length > 0 && (
              <div className="py-1">
                <div className="px-2 pb-1 text-[11px] uppercase tracking-wide text-[var(--color-muted)]">Goods</div>
                {res.goods.map(g => (
                  <a key={g.id} href={`/goods?focus=${encodeURIComponent(g.id)}`} className="block px-2 py-1.5 text-sm hover:bg-white/5 rounded">
                    <div className="flex justify-between gap-3">
                      <span className="font-medium">{g.id}</span>
                      <span className="text-white/60">{g.name}</span>
                      <span className="text-white/60">{g.stock}</span>
                      <span className="text-white/60">{g.location}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
            {res.bins.length > 0 && (
              <div className="py-1">
                <div className="px-2 pb-1 text-[11px] uppercase tracking-wide text-[var(--color-muted)]">Bins</div>
                {res.bins.map(b => (
                  <a key={b.id} href={`/storage?focus=${encodeURIComponent(b.id)}`} className="block px-2 py-1.5 text-sm hover:bg-white/5 rounded">
                    <div className="flex justify-between gap-3">
                      <span className="font-medium">{b.id}</span>
                      <span className="text-white/60">{b.used}/{b.capacity}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
