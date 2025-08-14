import React from 'react';
import { GlobalSearch } from './components/GlobalSearch';
import { useAlerts, AlertEvent } from './hooks/useAlerts';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Dashboard from './pages/Dashboard';
import Goods from './pages/Goods';
import Storage from './pages/Storage';
import Shares from './pages/Shares';

function AppShell() {
  const location = useLocation();
  const shareMode = location.pathname.startsWith('/share/');
  const shareId = shareMode ? location.pathname.split('/')[2] : null;
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-foreground)]">
      {!shareMode && (
        <header className="sticky top-0 z-10 border-b border-white/5 bg-black/30 backdrop-blur soft-shadow">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-sm bg-[var(--color-accent)]" />
              <span className="font-semibold">Forge WMS</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <GlobalSearch />
              <nav className="flex items-center gap-6 text-sm">
                {[
                  { to: '/', label: 'Dashboard' },
                  { to: '/goods', label: 'Goods' },
                  { to: '/storage', label: 'Storage' },
                  { to: '/shares', label: 'Access Windows' },
                ].map(link => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      `relative transition-colors hover:text-white ${isActive ? 'text-white' : 'text-white/70'} after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:bg-[var(--color-accent)] after:transition-all ${isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'}`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
          {/* Mobile nav */}
          <div className="mx-auto max-w-7xl px-4 pb-3 md:hidden">
            <nav className="flex items-center gap-4 overflow-x-auto text-sm no-scrollbar">
              {[
                { to: '/', label: 'Dashboard' },
                { to: '/goods', label: 'Goods' },
                { to: '/storage', label: 'Storage' },
                { to: '/shares', label: 'Access' },
              ].map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `shrink-0 rounded-md px-3 py-1.5 border border-white/10 ${isActive ? 'bg-white/10 text-white' : 'text-white/70'} `
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>
      )}
      {shareMode && (
        <header className="sticky top-0 z-10 border-b border-white/5 bg-black/30 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-sm bg-[var(--color-accent)]" />
              <h1 className="text-sm font-semibold tracking-tight">Shared View</h1>
            </div>
            {shareId && (
              <nav className="flex items-center gap-4 text-xs">
                <NavLink to={`/share/${shareId}/dashboard`} className={({ isActive }) => `transition-colors hover:text-white ${isActive ? 'text-white' : 'text-white/70'}`}>Dashboard</NavLink>
                <NavLink to={`/share/${shareId}/goods`} className={({ isActive }) => `transition-colors hover:text-white ${isActive ? 'text-white' : 'text-white/70'}`}>Goods</NavLink>
              </nav>
            )}
          </div>
        </header>
      )}

      {/* In-app alerts banner */}
      {!shareMode && <AlertBanner />}

      <main className="mx-auto max-w-7xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/goods" element={<Goods />} />
            <Route path="/storage" element={<Storage />} />
            <Route path="/shares" element={<Shares />} />
            {/* Shared access window: minimal routes */}
            <Route path="/share/:id" element={<Navigate to="/share/:id/dashboard" replace />} />
            <Route path="/share/:id/dashboard" element={<Dashboard />} />
            <Route path="/share/:id/goods" element={<Goods />} />
          </Routes>
        </motion.div>
      </main>

      {!shareMode && (
        <footer className="border-t border-white/5 py-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Forge WMS
        </footer>
      )}
    </div>
  );
}

const AlertBanner: React.FC = () => {
  const [msg, setMsg] = React.useState<string | null>(null);
  const timerRef = React.useRef<number | null>(null);
  const format = (ev: AlertEvent): string | null => {
    if (ev.kind === 'AUDIT' && ev.entry) {
      const e: any = ev.entry;
      if (e.type === 'goods' && e.action === 'create') return `Added ${e.after?.id}`;
      if (e.type === 'goods' && e.action === 'update') return `Updated ${e.after?.id || e.before?.id}`;
      if (e.type === 'goods' && e.action === 'delete') return `Deleted ${e.before?.id}`;
      if (e.type === 'storage' && e.action === 'capacity') return `Bin ${e.after?.id} capacity ${e.after?.capacity}`;
      if (e.type === 'share') return `Share ${e.action}`;
      return `${e.type} ${e.action}`;
    }
    return null;
  };
  useAlerts((ev) => {
    const m = format(ev);
    if (!m) return;
    setMsg(m);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setMsg(null), 4000);
  });
  if (!msg) return null;
  return (
    <div className="sticky top-12 z-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mt-2 rounded-md bg-[var(--color-elev)] border border-white/10 px-3 py-2 text-sm text-white/90 soft-shadow">
          {msg}
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
