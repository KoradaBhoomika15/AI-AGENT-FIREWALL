import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  MessageSquare,
  ShieldAlert,
  CreditCard,
  Mail,
  User
} from 'lucide-react';
import { ApprovalRequest } from '../types';
import { firewallService } from '../services/firewallService';

interface ApprovalCenterPageProps {
  onRefreshStats?: () => void;
}

export const ApprovalCenterPage: React.FC<ApprovalCenterPageProps> = ({ onRefreshStats }) => {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Decision Modal State
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [reviewerComment, setReviewerComment] = useState<string>('');
  const [reviewerName, setReviewerName] = useState<string>('SOC Lead (Admin)');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchApprovals = async () => {
    setIsLoading(true);
    const data = await firewallService.getApprovals(activeTab);
    setApprovals(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchApprovals();
  }, [activeTab]);

  const handleOpenDecisionModal = (req: ApprovalRequest, type: 'APPROVE' | 'REJECT') => {
    setSelectedRequest(req);
    setDecisionType(type);
    setReviewerComment(
      type === 'APPROVE'
        ? 'Manual security clearance verified. Price adjustment / recipient authorized for testing.'
        : ''
    );
    setCommentError(null);
  };

  const handleSubmitDecision = async () => {
    if (!selectedRequest || !decisionType) return;

    if (decisionType === 'REJECT' && (!reviewerComment || reviewerComment.trim().length < 5)) {
      setCommentError('Reviewer rationale is mandatory when rejecting a security request (minimum 5 chars).');
      return;
    }

    setIsSubmitting(true);
    const res = await firewallService.decideApproval(
      selectedRequest.id,
      decisionType,
      reviewerComment,
      reviewerName
    );

    setIsSubmitting(false);

    if (res.success) {
      setToastMessage(res.message);
      setSelectedRequest(null);
      setDecisionType(null);
      setReviewerComment('');
      fetchApprovals();
      if (onRefreshStats) onRefreshStats();
      setTimeout(() => setToastMessage(null), 3500);
    } else {
      setCommentError(res.message || 'Failed to submit decision.');
    }
  };

  const filteredApprovals = approvals.filter((req) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      req.request_id.toLowerCase().includes(q) ||
      req.risk_reason.toLowerCase().includes(q) ||
      (req.product_name && req.product_name.toLowerCase().includes(q)) ||
      (req.recipient_email && req.recipient_email.toLowerCase().includes(q))
    );
  });

  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-emerald-500 text-emerald-300 text-xs font-mono shadow-2xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-1">
          <UserCheck className="w-3.5 h-3.5" />
          <span>Human-in-the-Loop Governance · Tier 2 SOC Gate</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Human Approval Center
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Review and adjudicate security requests held by the AI Agent Firewall due to price tampering, policy ambiguity, or unauthorized outbound recipients.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-amber-300 bg-amber-950/60 border border-amber-600/50 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>{pendingCount} Pending Approvals</span>
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono transition-all ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, product, reason..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Approvals List */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-500 text-xs font-mono">
          Loading approval queue...
        </div>
      ) : filteredApprovals.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-[#0C1222] border border-slate-800 p-8 space-y-3">
          <UserCheck className="w-10 h-10 mx-auto text-slate-600 stroke-[1.2]" />
          <h3 className="text-sm font-bold text-slate-300">No requests found in this queue</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Transactions requiring human oversight (e.g. price tampering or external email requests) will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredApprovals.map((req) => {
            const isPending = req.status === 'PENDING';
            const isPayment = req.action_type === 'PAYMENT_VALIDATION';

            return (
              <div
                key={req.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 transition-all ${
                  isPending
                    ? 'bg-[#0D1424] border-amber-500/30 hover:border-amber-500/60 shadow-lg shadow-black/20'
                    : req.status === 'APPROVED'
                    ? 'bg-[#0B1220] border-emerald-500/20 opacity-85'
                    : 'bg-[#0B1220] border-rose-500/20 opacity-85'
                }`}
              >
                {/* Header Card */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      {isPayment ? (
                        <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <Mail className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                      <span className="text-slate-400">{req.action_type}</span>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                        req.status === 'PENDING'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-600/50'
                          : req.status === 'APPROVED'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50'
                          : 'bg-rose-950/80 text-rose-300 border-rose-600/50'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {isPayment ? req.product_name || 'Payment Transaction' : 'Outbound Email Dispatch'}
                  </h3>

                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                    Req ID: <span className="text-slate-300 select-all">{req.request_id}</span>
                  </div>
                </div>

                {/* Risk Rationale Banner */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-start gap-2 text-slate-300 leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{req.risk_reason}</span>
                  </div>

                  {isPayment && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between font-mono text-[11px]">
                      <div>
                        <span className="text-slate-500">Expected: </span>
                        <span className="text-emerald-400 font-bold tabular-nums">
                          ₹{req.expected_amount?.toLocaleString('en-IN') ?? 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Requested: </span>
                        <span className="text-amber-400 font-bold tabular-nums">
                          ₹{req.requested_amount?.toLocaleString('en-IN') ?? 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}

                  {!isPayment && req.recipient_email && (
                    <div className="pt-2 border-t border-slate-800/80 font-mono text-[11px] text-slate-400">
                      <span>Target Recipient: </span>
                      <span className="text-cyan-300">{req.recipient_email}</span>
                    </div>
                  )}
                </div>

                {/* Audit notes if decided */}
                {!isPending && req.reviewer_comment && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1">
                    <div className="text-slate-500 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{req.reviewer_name || 'Reviewer'}:</span>
                    </div>
                    <div className="text-slate-300 pl-4 border-l border-slate-800">
                      "{req.reviewer_comment}"
                    </div>
                  </div>
                )}

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-[10px] font-mono text-slate-500">
                    Created: {new Date(req.created_at).toLocaleTimeString()}
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenDecisionModal(req, 'REJECT')}
                        className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition-all flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleOpenDecisionModal(req, 'APPROVE')}
                        className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                        <span>Approve</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reviewer Adjudication Modal */}
      {selectedRequest && decisionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedRequest(null)}
          />

          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-[#0D1424] border border-slate-700 p-6 shadow-2xl text-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {decisionType === 'APPROVE' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
                <h3 className="text-base font-bold text-white">
                  {decisionType === 'APPROVE' ? 'Authorize Security Exception' : 'Reject Security Request'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="text-slate-400">
                Ticket: <span className="text-slate-200">{selectedRequest.request_id}</span>
              </div>
              <div className="text-slate-400">
                Threat Rationale: <span className="text-amber-300">{selectedRequest.risk_reason}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Reviewer Identity
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">
                  Reviewer Justification / Comment{' '}
                  {decisionType === 'REJECT' && (
                    <span className="text-rose-400 font-mono">(Mandatory)</span>
                  )}
                </label>
                <span className="text-[10px] font-mono text-slate-500">Recorded in Audit Log</span>
              </div>
              <textarea
                value={reviewerComment}
                onChange={(e) => {
                  setReviewerComment(e.target.value);
                  setCommentError(null);
                }}
                rows={3}
                placeholder={
                  decisionType === 'REJECT'
                    ? 'State specific security rationale for rejection (e.g. Unverified coupon code / untrusted foreign domain)'
                    : 'Notes on manual verification'
                }
                className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                required={decisionType === 'REJECT'}
              />
              {commentError && (
                <p className="text-xs text-rose-400 mt-1 font-mono">{commentError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitDecision}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold text-white shadow-lg transition-all ${
                  decisionType === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                }`}
              >
                {isSubmitting
                  ? 'Saving Decision...'
                  : `Confirm ${decisionType === 'APPROVE' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
