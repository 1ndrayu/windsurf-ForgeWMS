import React from 'react';
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
        <header className="sticky top-0 z-10 border-b border-white/5 bg-black/30 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-sm bg-[var(--color-accent)]" />
              <h1 className="text-lg font-semibold tracking-tight">Forge WMS</h1>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm">
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
                    `transition-colors hover:text-white ${isActive ? 'text-white' : 'text-white/70'}`
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

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
