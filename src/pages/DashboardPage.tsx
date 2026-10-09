import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Mail,
  CreditCard,
  UserX,
  Activity,
  Filter,
  RefreshCw,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { DashboardStats, AuditLogEntry } from '../types';
import { firewallService } from '../services/firewallService';
import { DecisionBadge } from '../components/common/Badge';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const fetchStats = async () => {
    setIsLoading(true);
    const data = await firewallService.getDashboardStats();
    setStats(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const total = stats?.total_requests || 0;
  const allowed = stats?.allowed_count || 0;
  const blocked = stats?.blocked_count || 0;
  const pending = stats?.pending_approvals_count || 0;

  const allowedPct = total > 0 ? Math.round((allowed / total) * 100) : 0;
  const blockedPct = total > 0 ? Math.round((blocked / total) * 100) : 0;
  const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0;

  const recentFiltered = (stats?.recent_activity || []).filter((item) => {
    if (filterAction === 'ALL') return true;
    return item.action_type === filterAction;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-1">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>SOC Telemetry & Real-Time Analytics</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Security Monitoring Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry stream capturing transaction price checks, outbound email gates, and anonymous velocity thresholds.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Requests */}
        <div className="p-4 rounded-xl bg-[#0C1222] border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
            Total Requests
          </span>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {stats?.total_requests ?? 0}
          </div>
          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
            <Activity className="w-3 h-3 text-indigo-400" /> All channels
          </span>
        </div>

        {/* Allowed */}
        <div className="p-4 rounded-xl bg-[#0C1222] border border-emerald-900/40 space-y-1">
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">
            Allowed Actions
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-300 tabular-nums">
            {stats?.allowed_count ?? 0}
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono">
            {allowedPct}% pass rate
          </span>
        </div>

        {/* Blocked */}
        <div className="p-4 rounded-xl bg-[#0C1222] border border-rose-900/40 space-y-1">
          <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block">
            Blocked Actions
          </span>
          <div className="text-2xl font-bold font-mono text-rose-300 tabular-nums">
            {stats?.blocked_count ?? 0}
          </div>
          <span className="text-[10px] text-rose-400/80 font-mono">
            {blockedPct}% quarantined
          </span>
        </div>

        {/* Pending Approvals */}
        <div className="p-4 rounded-xl bg-[#0C1222] border border-amber-900/40 space-y-1">
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
            Pending Approvals
          </span>
          <div className="text-2xl font-bold font-mono text-amber-300 tabular-nums">
            {stats?.pending_approvals_count ?? 0}
          </div>
          <span className="text-[10px] text-amber-400/80 font-mono">
            Requires human sign-off
          </span>
        </div>

        {/* Incorrect Price Attempts */}
        <div className="p-4 rounded-xl bg-[#0C1222] border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Price Tamperings
          </span>
          <div className="text-2xl font-bold font-mono text-purple-400 tabular-nums">
            {stats?.incorrect_price_attempts ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Catalog discrepancies</span>
        </div>

        {/* Unauthorized Email Attempts */}
        <div className="p-4 rounded-xl bg-[#0C1222] border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Email Violations
          </span>
          <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
            {stats?.unauthorized_email_attempts ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Untrusted recipients</span>
        </div>

        {/* Anonymous Violations */}
        <div className="p-4 rounded-xl bg-[#0C1222] border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Rate Breaches
          </span>
          <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
            {stats?.anonymous_limit_violations ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">&gt;3 anon checkouts</span>
        </div>
      </div>

      {/* Visual Analytics / Threat Disposition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Disposition Distribution Bars */}
        <div className="lg:col-span-6 bg-[#0C1222] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Firewall Verdict Distribution
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Live Aggregate</span>
          </div>

          <div className="space-y-4">
            {/* Visual stacked bar */}
            <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${Math.max(5, allowedPct)}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Allowed: ${allowed}`}
              />
              <div
                style={{ width: `${Math.max(5, pendingPct)}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`Approval Required: ${pending}`}
              />
              <div
                style={{ width: `${Math.max(5, blockedPct)}%` }}
                className="bg-rose-500 transition-all duration-500"
                title={`Blocked: ${blocked}`}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-950">
                <span className="text-[10px] text-emerald-400 block font-semibold">ALLOWED</span>
                <span className="text-lg font-bold text-white tabular-nums">{allowed}</span>
                <span className="text-[10px] text-slate-500 block">({allowedPct}%)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-amber-950">
                <span className="text-[10px] text-amber-400 block font-semibold">
                  HELD FOR APPROVAL
                </span>
                <span className="text-lg font-bold text-white tabular-nums">{pending}</span>
                <span className="text-[10px] text-slate-500 block">({pendingPct}%)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-rose-950">
                <span className="text-[10px] text-rose-400 block font-semibold">BLOCKED</span>
                <span className="text-lg font-bold text-white tabular-nums">{blocked}</span>
                <span className="text-[10px] text-slate-500 block">({blockedPct}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Attack Vector Matrix */}
        <div className="lg:col-span-6 bg-[#0C1222] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white tracking-tight">Threat Intercept Vectors</h3>
            <span className="text-[10px] font-mono text-indigo-400">Policy Rules</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="font-semibold text-slate-200">Catalog Price Tampering</div>
                  <div className="text-[11px] text-slate-500">
                    Client-submitted price does not match verified server catalog
                  </div>
                </div>
              </div>
              <span className="font-mono text-purple-400 font-bold tabular-nums">
                {stats?.incorrect_price_attempts || 0} hits
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="font-semibold text-slate-200">Untrusted Recipient Outbound</div>
                  <div className="text-[11px] text-slate-500">
                    Destination domain absent from corporate whitelist
                  </div>
                </div>
              </div>
              <span className="font-mono text-cyan-400 font-bold tabular-nums">
                {stats?.unauthorized_email_attempts || 0} hits
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div className="flex items-center gap-3">
                <UserX className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-semibold text-slate-200">Anonymous Velocity Exceeded</div>
                  <div className="text-[11px] text-slate-500">
                    Rapid unauthenticated attempts exceeding session cap (&gt;3)
                  </div>
                </div>
              </div>
              <span className="font-mono text-amber-400 font-bold tabular-nums">
                {stats?.anonymous_limit_violations || 0} hits
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline Stream */}
      <div className="bg-[#0C1222] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Recent Security Events</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological log of AI Agent Firewall evaluations and policy triggers
            </p>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 py-1.5 px-2.5 focus:outline-none"
            >
              <option value="ALL">All Event Types</option>
              <option value="PAYMENT_VALIDATION">Payment Validation</option>
              <option value="EMAIL_VALIDATION">Email Validation</option>
            </select>
          </div>
        </div>

        {recentFiltered.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs font-mono">
            No matching events found.
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentFiltered.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 max-w-3xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DecisionBadge decision={item.decision} size="sm" />
                    <span className="font-mono font-bold text-slate-300">
                      {item.action_type}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="font-mono text-slate-500 text-[11px] select-all">
                      {item.request_id}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">
                      {item.source === 'demo_simulation' ? 'DEMO EVENT' : 'LIVE N8N'}
                    </span>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed font-mono">
                    {item.reason}
                  </p>
                </div>

                <div className="shrink-0 text-right font-mono text-[11px] text-slate-500">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
