import React from 'react';
import {
  Store,
  CreditCard,
  FlaskConical,
  UserCheck,
  LayoutDashboard,
  ScrollText,
  Settings as SettingsIcon,
  X,
  Server
} from 'lucide-react';
import { FirewallMode } from '../../types';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  pendingApprovalsCount: number;
  isOpen: boolean;
  onClose: () => void;
  mode: FirewallMode;
  n8nConfigured: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  pendingApprovalsCount,
  isOpen,
  onClose,
  mode,
  n8nConfigured
}) => {
  const navItems = [
    { id: 'store', label: 'Store', icon: Store, description: 'Catalog & Products' },
    { id: 'checkout', label: 'Checkout Simulator', icon: CreditCard, description: 'Simulate Transactions' },
    { id: 'lab', label: 'Firewall Testing Lab', icon: FlaskConical, description: '9 Interactive Scenarios' },
    {
      id: 'approvals',
      label: 'Human Approval Center',
      icon: UserCheck,
      description: 'Review Held Requests',
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined
    },
    { id: 'dashboard', label: 'Security Dashboard', icon: LayoutDashboard, description: 'Telemetry & Graphs' },
    { id: 'logs', label: 'Audit Logs', icon: ScrollText, description: 'Immutable Request Trail' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, description: 'n8n & Security Policies' }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[57px] left-0 z-50 lg:z-30 h-screen lg:h-[calc(100vh-57px)] w-64 bg-[#0A0F1D] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto p-4">
          {/* Mobile Header */}
          <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-800/80 lg:hidden">
            <span className="text-sm font-bold text-white font-mono">Navigation Menu</span>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section Navigation */}
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-mono font-semibold tracking-wider text-slate-500 uppercase">
              Core Modules
            </div>

            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span className="bg-amber-500 text-slate-950 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Engine Status Card */}
        <div className="p-3.5 m-3 rounded-lg bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] font-medium text-slate-300">Firewall Engine</span>
            </div>
            <span
              className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                mode === 'live'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                  : 'bg-indigo-950 text-indigo-300 border border-indigo-800/50'
              }`}
            >
              {mode}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {mode === 'live'
              ? n8nConfigured
                ? 'External n8n workflow actively validating all actions.'
                : 'Live mode active with fail-closed security enforcement.'
              : 'Server-side rule engine simulation active with test scenarios.'}
          </p>
        </div>
      </aside>
    </>
  );
};
