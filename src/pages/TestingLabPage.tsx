import React, { useState } from 'react';
import {
  FlaskConical,
  Play,
  Mail,
  CreditCard,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Code2,
  HelpCircle
} from 'lucide-react';
import { FirewallMode, FirewallResponseContract } from '../types';
import { firewallService } from '../services/firewallService';
import { DecisionBadge } from '../components/common/Badge';

interface TestingLabPageProps {
  mode: FirewallMode;
  onNavigateToApprovals?: () => void;
  authorizedEmail: string;
}

interface Scenario {
  id: string;
  number: number;
  title: string;
  category: 'PAYMENT' | 'EMAIL' | 'SYSTEM';
  description: string;
  expectedDecision: 'ALLOW' | 'APPROVAL_REQUIRED' | 'BLOCK';
  payload: any;
}

export const TestingLabPage: React.FC<TestingLabPageProps> = ({
  mode,
  onNavigateToApprovals,
  authorizedEmail
}) => {
  // Scenario definitions (all 9 required)
  const scenarios: Scenario[] = [
    {
      id: 'sc_exact_price',
      number: 1,
      title: 'Valid Fixed-Price Payment',
      category: 'PAYMENT',
      description: 'Transaction requested amount matches verified server catalog price (₹1,999) for Smart Watch.',
      expectedDecision: 'ALLOW',
      payload: {
        action_type: 'PAYMENT_VALIDATION',
        product_id: 'smart-watch',
        requested_amount: 1999,
        expected_amount: 1999,
        anonymous_session: false,
        scenario: 'EXACT_PRICE_PURCHASE'
      }
    },
    {
      id: 'sc_incorrect_price',
      number: 2,
      title: 'Incorrect Payment Amount',
      category: 'PAYMENT',
      description: 'Client attempts to charge ₹1,100 instead of server ground-truth ₹1,499 for Wireless Headphones.',
      expectedDecision: 'APPROVAL_REQUIRED',
      payload: {
        action_type: 'PAYMENT_VALIDATION',
        product_id: 'wireless-headphones',
        requested_amount: 1100,
        expected_amount: 1499,
        anonymous_session: false,
        scenario: 'PRICE_TAMPERING'
      }
    },
    {
      id: 'sc_payment_rejection',
      number: 3,
      title: 'Human Rejection of a Payment',
      category: 'PAYMENT',
      description: 'A price-tampered payment request routed to Human Approval Center is rejected with mandatory reviewer comments.',
      expectedDecision: 'BLOCK',
      payload: {
        action_type: 'PAYMENT_VALIDATION',
        product_id: 'usb-c-hub',
        requested_amount: 450,
        expected_amount: 999,
        anonymous_session: false,
        scenario: 'HUMAN_REJECTION_FLOW'
      }
    },
    {
      id: 'sc_payment_approval',
      number: 4,
      title: 'Human Approval of Eligible Payment',
      category: 'PAYMENT',
      description: 'An eligible promotional discount request is validated and manually cleared by SOC reviewer.',
      expectedDecision: 'APPROVAL_REQUIRED',
      payload: {
        action_type: 'PAYMENT_VALIDATION',
        product_id: 'laptop-stand',
        requested_amount: 699,
        expected_amount: 799,
        anonymous_session: false,
        scenario: 'HUMAN_APPROVAL_FLOW'
      }
    },
    {
      id: 'sc_excessive_anonymous',
      number: 5,
      title: 'Excessive Anonymous Purchases',
      category: 'PAYMENT',
      description: 'Session initiates 4th rapid checkout without credentials, breaching configured limit (max 3).',
      expectedDecision: 'BLOCK',
      payload: {
        action_type: 'PAYMENT_VALIDATION',
        product_id: 'usb-c-hub',
        requested_amount: 999,
        expected_amount: 999,
        anonymous_session: true,
        scenario: 'EXCESSIVE_ANONYMOUS'
      }
    },
    {
      id: 'sc_email_authorized',
      number: 6,
      title: 'Email to Authorized Company Address',
      category: 'EMAIL',
      description: `Simulated transaction receipt dispatched to whitelisted corporate address (${authorizedEmail}).`,
      expectedDecision: 'ALLOW',
      payload: {
        action_type: 'EMAIL_VALIDATION',
        sender_email: 'store@shieldstore.com',
        recipient_email: authorizedEmail,
        subject: 'Order Confirmation #ORD-44910',
        message_preview: 'Simulated order invoice and security token dispatch.',
        scenario: 'AUTHORIZED_EMAIL'
      }
    },
    {
      id: 'sc_email_unauthorized',
      number: 7,
      title: 'Email to Unauthorized Recipient',
      category: 'EMAIL',
      description: 'Simulated dispatch targeted to external untrusted address (exfil@darkleak.net).',
      expectedDecision: 'APPROVAL_REQUIRED',
      payload: {
        action_type: 'EMAIL_VALIDATION',
        sender_email: 'store@shieldstore.com',
        recipient_email: 'exfil@darkleak.net',
        subject: 'Database Export & Customer Ledger',
        message_preview: 'Sensitive transactional invoice copy with hash signatures.',
        scenario: 'UNAUTHORIZED_EMAIL'
      }
    },
    {
      id: 'sc_email_rejection',
      number: 8,
      title: 'Human Rejection of Email Request',
      category: 'EMAIL',
      description: 'An external recipient request escalated to human reviewer is blocked due to domain policy violation.',
      expectedDecision: 'APPROVAL_REQUIRED',
      payload: {
        action_type: 'EMAIL_VALIDATION',
        sender_email: 'store@shieldstore.com',
        recipient_email: 'competitor-scout@external-risk.org',
        subject: 'Confidential Batch Allocation',
        message_preview: 'Simulated test invoice.',
        scenario: 'HUMAN_REJECTION_EMAIL'
      }
    },
    {
      id: 'sc_n8n_unavailable',
      number: 9,
      title: 'n8n Webhook Timeout / Fail-Closed',
      category: 'SYSTEM',
      description: 'Simulates n8n endpoint unreachable or hanging. Application enforces fail-closed blocking.',
      expectedDecision: 'BLOCK',
      payload: {
        action_type: 'PAYMENT_VALIDATION',
        product_id: 'smart-watch',
        requested_amount: 1999,
        expected_amount: 1999,
        scenario: 'N8N_TIMEOUT_TEST',
        mode: 'live'
      }
    }
  ];

  const [activeScenario, setActiveScenario] = useState<Scenario>(scenarios[0]);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'PAYMENT' | 'EMAIL' | 'SYSTEM'>('ALL');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<FirewallResponseContract | null>(null);
  const [customPayload, setCustomPayload] = useState<string>(
    JSON.stringify(scenarios[0].payload, null, 2)
  );

  // Email form simulator state
  const [emailForm, setEmailForm] = useState({
    sender: 'store-mailer@shieldstore.com',
    recipient: authorizedEmail,
    subject: 'Simulated Order Security Receipt #9902',
    message: 'Thank you for testing the AI Agent Firewall. Your order simulation is complete.'
  });
  const [emailRunning, setEmailRunning] = useState(false);
  const [emailResult, setEmailResult] = useState<FirewallResponseContract | null>(null);

  const handleSelectScenario = (sc: Scenario) => {
    setActiveScenario(sc);
    setCustomPayload(JSON.stringify(sc.payload, null, 2));
    setExecutionResult(null);
  };

  const handleRunScenario = async () => {
    setIsRunning(true);
    setExecutionResult(null);

    let parsedPayload = {};
    try {
      parsedPayload = JSON.parse(customPayload);
    } catch (e) {
      parsedPayload = activeScenario.payload;
    }

    const result = await firewallService.submitEvaluation({
      ...parsedPayload,
      session_id: firewallService.getOrCreateSessionId(),
      mode: activeScenario.id === 'sc_n8n_unavailable' ? 'live' : mode
    });

    setExecutionResult(result);
    setIsRunning(false);
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailRunning(true);
    setEmailResult(null);

    const payload = {
      action_type: 'EMAIL_VALIDATION' as const,
      sender_email: emailForm.sender,
      recipient_email: emailForm.recipient,
      subject: emailForm.subject,
      message_preview: emailForm.message,
      session_id: firewallService.getOrCreateSessionId(),
      scenario:
        emailForm.recipient.trim().toLowerCase() === authorizedEmail.trim().toLowerCase()
          ? 'AUTHORIZED_EMAIL'
          : 'UNAUTHORIZED_EMAIL'
    };

    const result = await firewallService.submitEvaluation(payload);
    setEmailResult(result);
    setEmailRunning(false);
  };

  const filteredScenarios = scenarios.filter(
    (s) => activeCategory === 'ALL' || s.category === activeCategory
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-1">
          <FlaskConical className="w-3.5 h-3.5" />
          <span>Interactive Security Suite · 9 Pre-Engineered Tests</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              AI Firewall Testing Lab
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Execute standardized attack and policy test vectors against the AI Agent Firewall. Compare expected security invariants against live returned verdicts.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 border border-slate-800 p-2 rounded-lg">
            <span className="text-slate-400">Execution Mode:</span>
            <span
              className={`font-bold uppercase ${
                mode === 'live' ? 'text-emerald-400' : 'text-indigo-400'
              }`}
            >
              {mode === 'live' ? 'Live n8n Dispatch' : 'Demo Rule Engine'}
            </span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {(['ALL', 'PAYMENT', 'EMAIL', 'SYSTEM'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {cat === 'ALL' ? 'All Scenarios (9)' : `${cat} Scenarios`}
          </button>
        ))}
      </div>

      {/* Scenario Grid & Execution Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Scenarios List Column (Left) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-mono text-slate-400 px-1">
            Click to select test scenario:
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredScenarios.map((sc) => {
              const isSelected = activeScenario.id === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => handleSelectScenario(sc)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-lg shadow-indigo-950/50'
                      : 'bg-[#0C1222] border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono text-indigo-400 font-bold">
                      Scenario #{sc.number}
                    </span>
                    <DecisionBadge decision={sc.expectedDecision} size="sm" showIcon={false} />
                  </div>

                  <h4 className="text-xs font-bold text-slate-100">{sc.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {sc.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Scenario Runner & Telemetry (Right) */}
        <div className="lg:col-span-7 bg-[#0C1222] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold block">
                Selected Test #{activeScenario.number}
              </span>
              <h3 className="text-base font-bold text-white">{activeScenario.title}</h3>
            </div>
            <button
              onClick={handleRunScenario}
              disabled={isRunning}
              className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {isRunning ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
              <span>{isRunning ? 'Evaluating...' : 'Execute Scenario'}</span>
            </button>
          </div>

          {/* Description & Invariant Expectation */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
            <div className="text-slate-300">{activeScenario.description}</div>
            <div className="flex items-center gap-2 text-slate-400 pt-1 font-mono text-[11px]">
              <span>Expected Verdict:</span>
              <DecisionBadge decision={activeScenario.expectedDecision} size="sm" />
            </div>
          </div>

          {/* Payload Inspector / Editor */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Submitted Payload JSON</span>
              </span>
              <span className="text-[10px] text-slate-500">Editable before execution</span>
            </div>
            <textarea
              value={customPayload}
              onChange={(e) => setCustomPayload(e.target.value)}
              rows={6}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Result Telemetry Box */}
          {executionResult && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Firewall Execution Result
                </span>
                <DecisionBadge decision={executionResult.decision} size="md" />
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  executionResult.decision === activeScenario.expectedDecision
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-amber-950/20 border-amber-500/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {executionResult.decision === activeScenario.expectedDecision ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {executionResult.decision === activeScenario.expectedDecision
                      ? 'Policy Invariant Verified: Decision matches expected security rule'
                      : 'Observed Decision Divergence'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  {executionResult.reason}
                </p>

                {executionResult.requires_approval && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-amber-300">
                      Approval Ticket ID: {executionResult.approval_id}
                    </span>
                    {onNavigateToApprovals && (
                      <button
                        onClick={onNavigateToApprovals}
                        className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline"
                      >
                        Go to Human Approval Center →
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Response Inspector */}
              <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] font-mono text-slate-400 flex justify-between">
                  <span>Returned Response Contract</span>
                  <span>Latency: {executionResult.latency_ms ?? 12}ms</span>
                </div>
                <pre className="p-3 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
                  {JSON.stringify(executionResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Dedicated Email Recipient Security Firewall Testing */}
      <div className="pt-6 border-t border-slate-800 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-1">
            <Mail className="w-3.5 h-3.5" />
            <span>Outbound Email Firewall Module · Destination Whitelist Policy</span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Email Recipient Security Firewall Simulator
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Test outbound communications. Emails directed to the authorized address are approved; unauthorized external domains require supervisor clearance.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Email Testing Form */}
          <form
            onSubmit={handleSendTestEmail}
            className="lg:col-span-7 bg-[#0C1222] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4"
          >
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono flex items-center justify-between text-slate-400">
              <span>Active Authorized Address:</span>
              <span className="text-emerald-400 font-bold">{authorizedEmail}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Sender Address</label>
                <input
                  type="email"
                  value={emailForm.sender}
                  onChange={(e) => setEmailForm({ ...emailForm, sender: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Recipient Email</label>
                <input
                  type="email"
                  value={emailForm.recipient}
                  onChange={(e) => setEmailForm({ ...emailForm, recipient: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Quick Email Presets */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEmailForm({ ...emailForm, recipient: authorizedEmail })}
                className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-slate-800"
              >
                Use Authorized ({authorizedEmail})
              </button>
              <button
                type="button"
                onClick={() =>
                  setEmailForm({ ...emailForm, recipient: 'external-attacker@darkleak.net' })
                }
                className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-amber-400 hover:bg-slate-800"
              >
                Use Unauthorized (darkleak.net)
              </button>
            </div>

            <div className="text-xs">
              <label className="block text-slate-300 font-semibold mb-1">Subject</label>
              <input
                type="text"
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none"
                required
              />
            </div>

            <div className="text-xs">
              <label className="block text-slate-300 font-semibold mb-1">Message Preview</label>
              <textarea
                value={emailForm.message}
                onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                rows={3}
                className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={emailRunning}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {emailRunning ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Submit Email to Firewall</span>
            </button>
          </form>

          {/* Email Verdict Inspector */}
          <div className="lg:col-span-5 bg-[#0C1222] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white tracking-tight">Email Firewall Verdict</h3>

            {!emailResult ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Mail className="w-8 h-8 mx-auto text-slate-600 stroke-[1.3]" />
                <p className="text-xs text-slate-400">No email evaluated yet</p>
                <p className="text-[11px] text-slate-500">
                  Send a test email above to verify recipient domain isolation.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-xl border ${
                    emailResult.decision === 'ALLOW'
                      ? 'bg-emerald-950/30 border-emerald-500/40'
                      : 'bg-amber-950/30 border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      Decision
                    </span>
                    <DecisionBadge decision={emailResult.decision} size="sm" />
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-mono">
                    {emailResult.reason}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono space-y-2 text-slate-400">
                  <div className="flex justify-between">
                    <span>Recipient Tested:</span>
                    <span className="text-slate-200">{emailForm.recipient}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dispatch Policy:</span>
                    <span className="text-indigo-300">Simulated Sandbox Preview</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Approval Required:</span>
                    <span className={emailResult.requires_approval ? 'text-amber-400' : 'text-emerald-400'}>
                      {String(emailResult.requires_approval)}
                    </span>
                  </div>
                </div>

                {emailResult.requires_approval && onNavigateToApprovals && (
                  <button
                    onClick={onNavigateToApprovals}
                    className="w-full py-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/30 transition-colors"
                  >
                    View in Human Approval Center →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
