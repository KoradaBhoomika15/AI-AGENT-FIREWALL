import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Zap,
  Download,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Lock,
  Globe
} from 'lucide-react';
import { SystemSettings, FirewallMode } from '../types';
import { firewallService } from '../services/firewallService';
import { PRODUCT_LIST } from '../data/products';
import { N8N_WORKFLOW_TEMPLATE } from '../server/n8nTemplate';

interface SettingsPageProps {
  onSettingsSaved?: (newSettings: SystemSettings) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onSettingsSaved }) => {
  const [settings, setSettings] = useState<SystemSettings>({
    authorized_company_email: 'security@shieldstore.internal',
    anonymous_purchase_limit: 3,
    n8n_webhook_url: '',
    firewall_mode: 'demo',
    fail_closed_enabled: true,
    webhook_timeout_ms: 3500
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'error';
    message: string;
    latency_ms?: number;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedWorkflow, setCopiedWorkflow] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const data = await firewallService.getSettings();
      setSettings(data);
      setIsLoading(false);
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTestResult(null);

    const res = await firewallService.updateSettings(settings);
    setIsSaving(false);

    if (res.success) {
      setToastMessage('Security policies successfully updated and enforced on backend.');
      if (onSettingsSaved) onSettingsSaved(res.data);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleTestWebhook = async () => {
    if (!settings.n8n_webhook_url) {
      setTestResult({
        status: 'error',
        message: 'Please specify a valid n8n Webhook URL before testing.'
      });
      return;
    }

    setIsTestingWebhook(true);
    setTestResult(null);

    const res = await firewallService.testWebhook(settings.n8n_webhook_url);
    setIsTestingWebhook(false);

    if (res.success) {
      setTestResult({
        status: 'success',
        message: res.message,
        latency_ms: res.latency_ms
      });
    } else {
      setTestResult({
        status: 'error',
        message: res.message
      });
    }
  };

  const handleCopyWorkflow = () => {
    navigator.clipboard.writeText(JSON.stringify(N8N_WORKFLOW_TEMPLATE, null, 2));
    setCopiedWorkflow(true);
    setTimeout(() => setCopiedWorkflow(false), 2000);
  };

  const handleDownloadWorkflow = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(N8N_WORKFLOW_TEMPLATE, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'n8n_ai_firewall_workflow.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleResetSessionCounter = async () => {
    const sessionId = firewallService.getOrCreateSessionId();
    await firewallService.resetSession(sessionId);
    setToastMessage(`Rate-limiting counter for session '${sessionId}' has been reset to 0.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-emerald-500 text-emerald-300 text-xs font-mono shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-1">
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>Firewall Configuration & n8n Integration Gateway</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          System & Policy Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Configure security invariants enforced strictly on the trusted backend. Connect your external n8n webhook workflow for live AI Agent evaluation.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Module 1: Execution Mode */}
        <div className="bg-[#0C1222] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Execution Mode</h3>
              <p className="text-xs text-slate-400">
                Switch between server-side simulation and live n8n workflow evaluation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSettings({ ...settings, firewall_mode: 'demo' })}
              className={`p-4 rounded-xl border text-left transition-all ${
                settings.firewall_mode === 'demo'
                  ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-bold text-xs text-indigo-300">
                  <Cpu className="w-4 h-4" />
                  <span>Demo Mode (Local Simulation)</span>
                </div>
                {settings.firewall_mode === 'demo' && (
                  <Check className="w-4 h-4 text-indigo-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Uses the server-side rule engine to evaluate pricing checks, email isolation, and rate-limits. Ideal for offline hackathon demonstrations.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSettings({ ...settings, firewall_mode: 'live' })}
              className={`p-4 rounded-xl border text-left transition-all ${
                settings.firewall_mode === 'live'
                  ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-bold text-xs text-emerald-300">
                  <Zap className="w-4 h-4" />
                  <span>Live Firewall Mode (n8n Webhook)</span>
                </div>
                {settings.firewall_mode === 'live' && (
                  <Check className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Forwards transactions directly to your active n8n AI Agent Workflow. Fails closed if n8n is unreachable or times out.
              </p>
            </button>
          </div>
        </div>

        {/* Module 2: n8n Webhook Gateway */}
        <div className="bg-[#0C1222] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">External n8n Webhook Gateway</h3>
              <p className="text-xs text-slate-400">
                Target endpoint for the AI Agent Firewall inbound workflow
              </p>
            </div>
            <div className="text-[11px] font-mono text-slate-500">Fail-Closed Protected</div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 font-mono">
                VITE_N8N_FIREWALL_WEBHOOK_URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={settings.n8n_webhook_url}
                  onChange={(e) => setSettings({ ...settings, n8n_webhook_url: e.target.value })}
                  placeholder="https://n8n.your-domain.com/webhook/ai-agent-firewall"
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={isTestingWebhook}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono font-semibold text-slate-200 transition-all flex items-center gap-2"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isTestingWebhook ? 'animate-spin text-indigo-400' : ''}`}
                  />
                  <span>Test Webhook</span>
                </button>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                  testResult.status === 'success'
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {testResult.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
                {testResult.latency_ms !== undefined && (
                  <span className="text-[11px] text-slate-400">{testResult.latency_ms}ms</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Module 3: Security Invariant Policies */}
        <div className="bg-[#0C1222] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Security Invariant Policies</h3>
            <p className="text-xs text-slate-400">
              Enforced server-side. Cannot be bypassed or tampered by frontend manipulation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Authorized Company Email Address
              </label>
              <input
                type="email"
                value={settings.authorized_company_email}
                onChange={(e) =>
                  setSettings({ ...settings, authorized_company_email: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Outbound emails to any other domain/address trigger supervisor review.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">
                  Anonymous Purchase Attempt Limit
                </label>
                <button
                  type="button"
                  onClick={handleResetSessionCounter}
                  className="text-[11px] font-mono text-indigo-400 hover:underline"
                >
                  Reset Current Session Counter
                </button>
              </div>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.anonymous_purchase_limit}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    anonymous_purchase_limit: Number(e.target.value)
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Maximum allowed checkout attempts without authentication per session identifier.
              </p>
            </div>
          </div>
        </div>

        {/* Module 4: Product Ground Truth Catalog */}
        <div className="bg-[#0C1222] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Server-Locked Product Prices</h3>
              <p className="text-xs text-slate-400">
                Ground-truth catalog enforced by the backend and n8n policy engine
              </p>
            </div>
            <Lock className="w-4 h-4 text-slate-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRODUCT_LIST.map((prod) => (
              <div
                key={prod.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-200 truncate">{prod.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{prod.id}</div>
                </div>
                <div className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                  ₹{prod.price.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Module 5: Importable n8n Workflow JSON Blueprint */}
        <div className="bg-[#0C1222] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Importable n8n Workflow JSON</h3>
              <p className="text-xs text-slate-400">
                Download or copy this workflow definition to import directly into your n8n workspace
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyWorkflow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 transition-colors"
              >
                {copiedWorkflow ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedWorkflow ? 'Copied!' : 'Copy JSON'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadWorkflow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-medium shadow-md shadow-indigo-600/20 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .json</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
            <pre className="p-4 text-[11px] font-mono text-slate-300 max-h-48 overflow-y-auto">
              {JSON.stringify(N8N_WORKFLOW_TEMPLATE, null, 2)}
            </pre>
          </div>
        </div>

        {/* Save Bar */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Applying to Server...' : 'Save & Enforce Policies'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
