import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Send,
  RefreshCw,
  AlertTriangle,
  FileCode,
  DollarSign,
  Fingerprint
} from 'lucide-react';
import { Product, FirewallResponseContract } from '../types';
import { PRODUCT_LIST, SERVER_PRODUCTS } from '../data/products';
import { firewallService } from '../services/firewallService';
import { DecisionBadge } from '../components/common/Badge';

interface CheckoutSimulatorProps {
  initialProduct?: Product | null;
  onNavigateToApprovals?: () => void;
}

export const CheckoutSimulator: React.FC<CheckoutSimulatorProps> = ({
  initialProduct,
  onNavigateToApprovals
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProduct?.id || PRODUCT_LIST[0].id
  );
  const selectedProduct = SERVER_PRODUCTS[selectedProductId] || PRODUCT_LIST[0];

  const [requestedAmount, setRequestedAmount] = useState<number>(selectedProduct.price);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>(firewallService.getOrCreateSessionId());
  const [customerName, setCustomerName] = useState<string>('Alex Chen');
  const [customerEmail, setCustomerEmail] = useState<string>('alex.chen@example.com');
  const [shippingAddress, setShippingAddress] = useState<string>('404 Cyber Parkway, Tech Sector');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastResponse, setLastResponse] = useState<FirewallResponseContract | null>(null);
  const [tamperingPreset, setTamperingPreset] = useState<string>('exact');

  // Update requested amount when product changes if on exact preset
  useEffect(() => {
    if (tamperingPreset === 'exact') {
      setRequestedAmount(selectedProduct.price);
    } else if (tamperingPreset === 'underpay') {
      setRequestedAmount(Math.max(1, Math.floor(selectedProduct.price * 0.6)));
    } else if (tamperingPreset === 'overpay') {
      setRequestedAmount(selectedProduct.price + 500);
    }
  }, [selectedProductId, tamperingPreset, selectedProduct.price]);

  const handlePresetSelect = (preset: 'exact' | 'underpay' | 'overpay' | 'zero') => {
    setTamperingPreset(preset);
    if (preset === 'exact') {
      setRequestedAmount(selectedProduct.price);
    } else if (preset === 'underpay') {
      setRequestedAmount(Math.max(10, Math.floor(selectedProduct.price * 0.5)));
    } else if (preset === 'overpay') {
      setRequestedAmount(selectedProduct.price + 1000);
    } else if (preset === 'zero') {
      setRequestedAmount(0);
    }
  };

  const handleRegenerateSession = () => {
    const newId = firewallService.regenerateSessionId();
    setSessionId(newId);
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLastResponse(null);

    const payload = {
      action_type: 'PAYMENT_VALIDATION' as const,
      session_id: sessionId,
      product_id: selectedProduct.id,
      requested_amount: requestedAmount,
      expected_amount: selectedProduct.price,
      anonymous_session: isAnonymous,
      scenario: isAnonymous
        ? 'ANONYMOUS_PURCHASE'
        : requestedAmount !== selectedProduct.price
        ? 'PRICE_TAMPERING'
        : 'EXACT_PRICE_PURCHASE'
    };

    const result = await firewallService.submitEvaluation(payload);
    setLastResponse(result);
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-1">
          <Fingerprint className="w-3.5 h-3.5" />
          <span>Payment Security Module · Real-time Rule Interceptor</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Payment Firewall Checkout Simulator
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Simulate e-commerce checkouts with verified server catalog prices versus client-requested amounts. Every submission is forwarded to the AI Agent Firewall before any authorization occurs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-[#0C1222] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <form onSubmit={handleSubmitTransaction} className="space-y-6">
            {/* Product Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                1. Select Target Product
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {PRODUCT_LIST.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => setSelectedProductId(prod.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                      selectedProductId === prod.id
                        ? 'bg-indigo-950/60 border-indigo-500/80 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-10 h-10 rounded-lg object-cover bg-slate-800 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate text-slate-200">{prod.name}</div>
                      <div className="text-[11px] font-mono text-emerald-400 font-semibold tabular-nums">
                        ₹{prod.price.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Integrity Section */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div>
                  <span className="text-[11px] font-mono text-slate-400 block">Server Ground Truth Price</span>
                  <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                    ₹{selectedProduct.price.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Validation Mode</span>
                  <span className="text-xs font-mono text-indigo-400 font-medium">Locked Backend Policy</span>
                </div>
              </div>

              {/* Price Presets */}
              <div>
                <label className="block text-[11px] font-mono font-medium text-slate-400 mb-1.5">
                  Test Price Scenarios (Presets):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('exact')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium border text-center transition-all ${
                      tamperingPreset === 'exact'
                        ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Exact ₹{selectedProduct.price}
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('underpay')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium border text-center transition-all ${
                      tamperingPreset === 'underpay'
                        ? 'bg-amber-950/80 border-amber-500/70 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tampered Underpay
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('overpay')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium border text-center transition-all ${
                      tamperingPreset === 'overpay'
                        ? 'bg-purple-950/80 border-purple-500/70 text-purple-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Excessive Price
                  </button>
                </div>
              </div>

              {/* Editable Requested Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Requested Transaction Amount (Client Payload ₹):
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={requestedAmount}
                    onChange={(e) => {
                      setRequestedAmount(Number(e.target.value));
                      setTamperingPreset('custom');
                    }}
                    className={`w-full pl-9 pr-4 py-2.5 bg-slate-900 border rounded-lg text-white font-mono text-sm focus:outline-none transition-colors ${
                      requestedAmount === selectedProduct.price
                        ? 'border-slate-700 focus:border-indigo-500'
                        : 'border-amber-500/70 text-amber-300 focus:border-amber-400'
                    }`}
                    placeholder="Enter amount"
                    required
                  />
                </div>
                {requestedAmount !== selectedProduct.price && (
                  <p className="text-[11px] text-amber-400/90 mt-1 flex items-center gap-1 font-mono">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Price mismatch detected. AI Firewall will escalate to Human Approval.</span>
                  </p>
                )}
              </div>
            </div>

            {/* Session & Anonymous Settings */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    Anonymous Checkout Mode
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Bypasses KYC identity and tests anonymous attempt velocity limits
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Session ID display & reset */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-mono">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 block">Session Identifier</span>
                  <span className="text-slate-300 truncate block">{sessionId}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateSession}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 shrink-0 transition-colors"
                  title="Generate a new session ID"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>New Session</span>
                </button>
              </div>

              {/* Simulated Customer Fields */}
              {!isAnonymous && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Customer Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Customer Email</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Against Firewall Rules...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Transaction to Firewall</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results & Firewall Inspector Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0C1222] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">Firewall Telemetry Verdict</h3>
              </div>
              {lastResponse && <DecisionBadge decision={lastResponse.decision} size="sm" />}
            </div>

            {!lastResponse && (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <ShieldAlert className="w-10 h-10 mx-auto text-slate-600 stroke-[1.3]" />
                <p className="text-xs font-medium text-slate-400">Awaiting Submission</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Submit a transaction to inspect the AI Agent Firewall’s real-time security decision.
                </p>
              </div>
            )}

            {lastResponse && (
              <div className="space-y-4">
                {/* Decision Banner */}
                <div
                  className={`p-4 rounded-xl border ${
                    lastResponse.decision === 'ALLOW'
                      ? 'bg-emerald-950/30 border-emerald-500/40'
                      : lastResponse.decision === 'APPROVAL_REQUIRED'
                      ? 'bg-amber-950/30 border-amber-500/40'
                      : 'bg-rose-950/30 border-rose-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      Security Verdict
                    </span>
                    <DecisionBadge decision={lastResponse.decision} size="md" />
                  </div>
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    {lastResponse.reason}
                  </p>

                  {lastResponse.requires_approval && (
                    <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center justify-between">
                      <span className="text-[11px] text-amber-300 font-mono">
                        Approval ID: {lastResponse.approval_id}
                      </span>
                      {onNavigateToApprovals && (
                        <button
                          onClick={onNavigateToApprovals}
                          className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 underline"
                        >
                          Review in Approval Center →
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Audit Attributes */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Transaction ID:</span>
                    <span className="text-slate-200 select-all">{lastResponse.request_id}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Expected Amount:</span>
                    <span className="text-emerald-400 font-bold tabular-nums">
                      ₹{lastResponse.expected_amount?.toLocaleString('en-IN') ?? 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Requested Amount:</span>
                    <span
                      className={`font-bold tabular-nums ${
                        lastResponse.requested_amount !== lastResponse.expected_amount
                          ? 'text-amber-400'
                          : 'text-slate-200'
                      }`}
                    >
                      ₹{lastResponse.requested_amount?.toLocaleString('en-IN') ?? 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Evaluation Source:</span>
                    <span className="text-indigo-300">{lastResponse.source}</span>
                  </div>
                  {lastResponse.latency_ms !== undefined && (
                    <div className="flex justify-between text-slate-400">
                      <span>Inspection Latency:</span>
                      <span className="text-slate-300 tabular-nums">{lastResponse.latency_ms}ms</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>Timestamp:</span>
                    <span className="text-slate-300 tabular-nums">
                      {new Date(lastResponse.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Raw Response JSON Preview */}
                <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                  <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] font-mono text-slate-400">
                    Contract Payload
                  </div>
                  <pre className="p-3 text-[11px] font-mono text-slate-300 overflow-x-auto">
                    {JSON.stringify(lastResponse, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
