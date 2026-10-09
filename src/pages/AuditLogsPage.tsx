import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Download,
  X,
  FileCode,
  ShieldCheck,
  CreditCard,
  Mail
} from 'lucide-react';
import { AuditLogEntry } from '../types';
import { firewallService } from '../services/firewallService';
import { DecisionBadge } from '../components/common/Badge';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [actionType, setActionType] = useState<string>('ALL');
  const [decision, setDecision] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    const data = await firewallService.getAuditLogs({
      search,
      action_type: actionType,
      decision: decision
    });
    setLogs(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [actionType, decision]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const exportToJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ai_firewall_audit_log_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-1">
            <ScrollText className="w-3.5 h-3.5" />
            <span>SOC Event Ledger · Immutable Audit Trail</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Security Audit Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Cryptographically keyed audit records for all e-commerce payment evaluations, email delivery validations, and human reviewer decisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#0C1222] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search request ID, reason, product..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px] font-mono">Action:</span>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 py-1.5 px-3 focus:outline-none"
            >
              <option value="ALL">All Actions</option>
              <option value="PAYMENT_VALIDATION">Payment</option>
              <option value="EMAIL_VALIDATION">Email</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px] font-mono">Decision:</span>
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 py-1.5 px-3 focus:outline-none"
            >
              <option value="ALL">All Verdicts</option>
              <option value="ALLOW">ALLOW</option>
              <option value="APPROVAL_REQUIRED">APPROVAL REQUIRED</option>
              <option value="BLOCK">BLOCK</option>
              <option value="ALERT">ALERT</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#0C1222] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Firewall Decision</th>
                <th className="py-3 px-4">Security Reason / Audit Rationale</th>
                <th className="py-3 px-4">Approval Status</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-900/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-200 select-all whitespace-nowrap">
                      {log.request_id}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        {log.action_type === 'PAYMENT_VALIDATION' ? (
                          <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <Mail className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                        <span>{log.action_type}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <DecisionBadge decision={log.decision} size="sm" />
                    </td>

                    <td className="py-3 px-4 text-slate-300 font-sans text-xs max-w-md truncate">
                      {log.reason}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border uppercase ${
                          log.approval_status === 'APPROVED'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                            : log.approval_status === 'REJECTED'
                            ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                            : log.approval_status === 'PENDING'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                            : 'text-slate-500 border-transparent'
                        }`}
                      >
                        {log.approval_status || 'N/A'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap tabular-nums">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Read-Only Event Inspector Drawer / Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedLog(null)}
          />

          <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-[#0D1424] border border-slate-700 p-6 shadow-2xl text-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  Audit Record Deep Inspection
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Summary Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Decision Verdict:</span>
                <DecisionBadge decision={selectedLog.decision} size="md" />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Request ID:</span>
                <span className="text-slate-200 select-all font-bold">{selectedLog.request_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Action Type:</span>
                <span className="text-indigo-300">{selectedLog.action_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Session ID:</span>
                <span className="text-slate-300">{selectedLog.session_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-300">{selectedLog.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Execution Engine:</span>
                <span className="text-slate-300">{selectedLog.source}</span>
              </div>

              {selectedLog.details.requested_amount !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Requested Amount:</span>
                  <span className="text-amber-400 font-bold tabular-nums">
                    ₹{selectedLog.details.requested_amount}
                  </span>
                </div>
              )}

              {selectedLog.details.expected_amount !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Server Verified Price:</span>
                  <span className="text-emerald-400 font-bold tabular-nums">
                    ₹{selectedLog.details.expected_amount}
                  </span>
                </div>
              )}

              {selectedLog.details.recipient_email && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Recipient Address:</span>
                  <span className="text-cyan-300">{selectedLog.details.recipient_email}</span>
                </div>
              )}

              {selectedLog.reviewer_comment && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 block mb-1">Reviewer Sign-off Note:</span>
                  <span className="text-emerald-300">"{selectedLog.reviewer_comment}"</span>
                </div>
              )}
            </div>

            {/* Complete Raw JSON */}
            <div>
              <span className="text-xs font-mono text-slate-400 block mb-1.5">
                Full Cryptographic JSON Payload:
              </span>
              <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 max-h-56 overflow-auto">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="py-2 px-5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
