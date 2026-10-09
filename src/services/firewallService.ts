import {
  ApprovalRequest,
  AuditLogEntry,
  DashboardStats,
  FirewallRequestPayload,
  FirewallResponseContract,
  SystemSettings
} from '../types';

export class FirewallService {
  private activeRequests: Set<string> = new Set();

  /**
   * Generates a collision-resistant unique request ID
   */
  public generateRequestId(prefix: string = 'req'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Generates or retrieves testing session identifier
   */
  public getOrCreateSessionId(): string {
    const KEY = 'ai_firewall_session_id';
    let sessionId = localStorage.getItem(KEY);
    if (!sessionId) {
      sessionId = `sess_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem(KEY, sessionId);
    }
    return sessionId;
  }

  /**
   * Reset session id for rate limit testing
   */
  public regenerateSessionId(): string {
    const KEY = 'ai_firewall_session_id';
    const newSessionId = `sess_${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem(KEY, newSessionId);
    return newSessionId;
  }

  /**
   * Main method to evaluate security actions through the firewall
   */
  public async submitEvaluation(payload: Partial<FirewallRequestPayload>): Promise<FirewallResponseContract> {
    const requestId = payload.request_id || this.generateRequestId();
    const sessionId = payload.session_id || this.getOrCreateSessionId();

    // Prevent duplicate in-flight submissions
    const dedupeKey = `${payload.action_type}_${sessionId}_${payload.product_id || payload.recipient_email}`;
    if (this.activeRequests.has(dedupeKey)) {
      return {
        request_id: requestId,
        decision: 'ALERT',
        reason: 'Duplicate request blocked: An identical transaction is currently in flight.',
        requires_approval: false,
        approval_id: null,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        source: 'server_rule_engine',
        error: 'DUPLICATE_SUBMISSION'
      };
    }

    this.activeRequests.add(dedupeKey);

    const fullPayload: FirewallRequestPayload = {
      request_id: requestId,
      action_type: payload.action_type || 'PAYMENT_VALIDATION',
      session_id: sessionId,
      product_id: payload.product_id,
      requested_amount: payload.requested_amount,
      expected_amount: payload.expected_amount,
      recipient_email: payload.recipient_email,
      sender_email: payload.sender_email,
      subject: payload.subject,
      message_preview: payload.message_preview,
      anonymous_session: Boolean(payload.anonymous_session),
      timestamp: new Date().toISOString(),
      scenario: payload.scenario,
      mode: payload.mode
    };

    try {
      const response = await fetch('/api/firewall/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fullPayload)
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || `HTTP ${response.status}: Firewall service error`);
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Invalid firewall payload structure received');
      }

      const contract: FirewallResponseContract = result.data;
      return contract;
    } catch (err: any) {
      // Fail closed policy: NEVER silently allow on network error or timeout
      return {
        request_id: requestId,
        decision: 'BLOCK',
        reason: `Firewall unavailable — action not executed. (${err.message || 'Connection failure'})`,
        requires_approval: false,
        approval_id: null,
        expected_amount: payload.expected_amount,
        requested_amount: payload.requested_amount,
        recipient_email: payload.recipient_email,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        source: 'server_rule_engine',
        error: err.message
      };
    } finally {
      this.activeRequests.delete(dedupeKey);
    }
  }

  /**
   * Fetch current system settings
   */
  public async getSettings(): Promise<SystemSettings> {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      return data.data;
    } catch (err) {
      return {
        authorized_company_email: 'security@shieldstore.internal',
        anonymous_purchase_limit: 3,
        n8n_webhook_url: '',
        firewall_mode: 'demo',
        fail_closed_enabled: true,
        webhook_timeout_ms: 3500
      };
    }
  }

  /**
   * Save system settings
   */
  public async updateSettings(settings: Partial<SystemSettings>): Promise<{ success: boolean; data: SystemSettings }> {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.json();
  }

  /**
   * Test webhook connectivity
   */
  public async testWebhook(url?: string): Promise<{ success: boolean; message: string; latency_ms?: number }> {
    try {
      const res = await fetch('/api/config/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      return res.json();
    } catch (err: any) {
      return {
        success: false,
        message: `Firewall unavailable — action not executed: ${err.message}`
      };
    }
  }

  /**
   * Fetch human approval requests
   */
  public async getApprovals(status: string = 'ALL'): Promise<ApprovalRequest[]> {
    try {
      const res = await fetch(`/api/approvals?status=${encodeURIComponent(status)}`);
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      return [];
    }
  }

  /**
   * Submit decision for pending approval
   */
  public async decideApproval(
    id: string,
    decision: 'APPROVE' | 'REJECT',
    comment: string,
    reviewerName: string = 'Security Analyst'
  ): Promise<{ success: boolean; message: string; data?: ApprovalRequest }> {
    const res = await fetch(`/api/approvals/${id}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision,
        reviewer_comment: comment,
        reviewer_name: reviewerName
      })
    });
    return res.json();
  }

  /**
   * Fetch audit logs
   */
  public async getAuditLogs(params?: { search?: string; action_type?: string; decision?: string }): Promise<AuditLogEntry[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.action_type) query.set('action_type', params.action_type);
    if (params?.decision) query.set('decision', params.decision);

    try {
      const res = await fetch(`/api/audit-logs?${query.toString()}`);
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      return [];
    }
  }

  /**
   * Fetch dashboard aggregated stats
   */
  public async getDashboardStats(): Promise<DashboardStats> {
    try {
      const res = await fetch('/api/dashboard/stats');
      const json = await res.json();
      return json.data;
    } catch (err) {
      return {
        total_requests: 0,
        allowed_count: 0,
        blocked_count: 0,
        pending_approvals_count: 0,
        incorrect_price_attempts: 0,
        unauthorized_email_attempts: 0,
        anonymous_limit_violations: 0,
        recent_activity: [],
        chart_data: {
          labels: [],
          allowed: [],
          blocked: [],
          approval_required: []
        }
      };
    }
  }

  /**
   * Reset anonymous session counter on server
   */
  public async resetSession(sessionId: string): Promise<void> {
    await fetch('/api/session/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
  }
}

export const firewallService = new FirewallService();
