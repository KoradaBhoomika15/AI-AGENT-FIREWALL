import React from 'react';
import { ShoppingBag, ShieldCheck, Terminal, Menu } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  cartCount,
  onOpenCart,
  onToggleSidebar
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090E1A]/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 flex items-center justify-between gap-8">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 focus:outline-none"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button
          onClick={() => onNavigate('store')}
          className="flex items-center gap-2.5 text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/20">
            <div className="w-full h-full bg-[#090E1A] rounded-[6px] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="whitespace-nowrap">
            <span className="text-base font-bold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
              NovaShield
            </span>
            <span className="hidden sm:inline text-xs text-slate-400 ml-2 font-mono">
              AI Firewall
            </span>
          </div>
        </button>
      </div>

      {/* Zone 2: Navigation Links (4-5 single line text links) */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => onNavigate('store')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            currentPage === 'store' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Store Catalog
        </button>
        <button
          onClick={() => onNavigate('lab')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            currentPage === 'lab' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Firewall Lab
        </button>
        <button
          onClick={() => onNavigate('approvals')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            currentPage === 'approvals' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Human Approvals
        </button>
        <button
          onClick={() => onNavigate('dashboard')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            currentPage === 'dashboard' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          SOC Dashboard
        </button>
        <button
          onClick={() => onNavigate('logs')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            currentPage === 'logs' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Audit Logs
        </button>
      </nav>

      {/* Zone 3: Primary Action (Cart Drawer Trigger) */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenCart}
          className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 text-white text-xs font-medium border border-slate-700/60 transition-all shadow-sm active:scale-95"
        >
          <ShoppingBag className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">Cart</span>
          {cartCount > 0 && (
            <span className="bg-indigo-600 text-white font-mono font-bold text-[11px] px-1.5 py-0.2 rounded-full min-w-4 text-center">
              {cartCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onNavigate('lab')}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-all"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Quick Inspect</span>
        </button>
      </div>
    </header>
  );
};
