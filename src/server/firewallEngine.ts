import {
  ApprovalRequest,
  AuditLogEntry,
  FirewallDecision,
  FirewallRequestPayload,
  FirewallResponseContract
} from '../types';
import { SERVER_PRODUCTS } from '../data/products';
import { serverStore } from './store';

export class FirewallEngine {
  /**
   * Main evaluation entrypoint
   */
  public async evaluate(payload: FirewallRequestPayload): Promise<FirewallResponseContract> {
    const startTime = Date.now();
    const requestId = payload.request_id || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sessionId = payload.session_id || 'sess_default';
    const isAnonymous = Boolean(payload.anonymous_session);
    const mode = payload.mode || serverStore.settings.firewall_mode;

    // Server-side Ground Truth Product Lookup
    let expectedAmount: number | undefined;
    let productName: string | undefined;
    if (payload.action_type === 'PAYMENT_VALIDATION' && payload.product_id) {
      const serverProduct = SERVER_PRODUCTS[payload.product_id];
      if (serverProduct) {
        expectedAmount = serverProduct.price;
        productName = serverProduct.name;
      }
    }

    // Step 1: Check rate limits for anonymous purchase sessions
    if (payload.action_type === 'PAYMENT_VALIDATION' && isAnonymous) {
      const currentAttempts = serverStore.incrementAnonymousCount(sessionId);
      if (currentAttempts > serverStore.settings.anonymous_purchase_limit) {
        const response: FirewallResponseContract = {
          request_id: requestId,
          decision: 'BLOCK',
          reason: `Security Violation: Session '${sessionId}' exceeded maximum anonymous checkout limit (${currentAttempts}/${serverStore.settings.anonymous_purchase_limit}). Session quarantined.`,
          requires_approval: false,
          approval_id: null,
          expected_amount: expectedAmount,
          requested_amount: payload.requested_amount,
          session_id: sessionId,
          timestamp: new Date().toISOString(),
          source: mode === 'live' ? 'n8n_live_workflow' : 'server_rule_engine',
          latency_ms: Date.now() - startTime
        };

        this.recordAudit(payload, response, productName);
        return response;
      }
    }

    // Step 2: If Live Firewall Mode is active and webhook is configured, call n8n
    if (mode === 'live') {
      const n8nUrl = serverStore.settings.n8n_webhook_url;
      if (!n8nUrl || n8nUrl.trim() === '') {
        // Fail-closed!
        const response: FirewallResponseContract = {
          request_id: requestId,
          decision: 'BLOCK',
          reason: 'Firewall unavailable — action not executed. No n8n webhook URL configured in settings or environment.',
          requires_approval: false,
          approval_id: null,
          expected_amount: expectedAmount,
          requested_amount: payload.requested_amount,
          recipient_email: payload.recipient_email,
          session_id: sessionId,
          timestamp: new Date().toISOString(),
          source: 'n8n_live_workflow',
          latency_ms: Date.now() - startTime,
          error: 'MISSING_WEBHOOK_URL'
        };
        this.recordAudit(payload, response, productName);
        return response;
      }

      try {
        const liveResponse = await this.callExternalN8nWebhook(n8nUrl, {
          ...payload,
          request_id: requestId,
          expected_amount: expectedAmount
        });

        // Enforce server-side security invariants:
        // Even if n8n returns ALLOW, if requested_amount does not match expected_amount, require approval!
        let finalDecision: FirewallDecision = liveResponse.decision || 'BLOCK';
        let requiresApproval: boolean = Boolean(liveResponse.requires_approval);
        let approvalId: string | null | undefined = liveResponse.approval_id;
        let finalReason: string = liveResponse.reason || 'Evaluated by external n8n workflow.';

        if (
          payload.action_type === 'PAYMENT_VALIDATION' &&
          expectedAmount !== undefined &&
          payload.requested_amount !== undefined &&
          payload.requested_amount !== expectedAmount
        ) {
          if (finalDecision === 'ALLOW') {
            finalDecision = 'APPROVAL_REQUIRED';
            requiresApproval = true;
            finalReason = `Server Security Invariant: Price mismatch (requested ₹${payload.requested_amount} vs verified ₹${expectedAmount}). Automatic allowance overridden to require human sign-off.`;
          }
        }

        if (requiresApproval && !approvalId) {
          approvalId = `appr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          this.createApprovalRecord({
            id: approvalId,
            request_id: requestId,
            action_type: payload.action_type,
            status: 'PENDING',
            risk_reason: finalReason,
            requested_amount: payload.requested_amount,
            expected_amount: expectedAmount,
            recipient_email: payload.recipient_email,
            session_id: sessionId,
            product_id: payload.product_id,
            product_name: productName,
            created_at: new Date().toISOString(),
            can_override: true
          });
        }

        const normalized: FirewallResponseContract = {
          request_id: requestId,
          decision: finalDecision,
          reason: finalReason,
          requires_approval: requiresApproval,
          approval_id: approvalId,
          expected_amount: expectedAmount,
          requested_amount: payload.requested_amount,
          recipient_email: payload.recipient_email,
          session_id: sessionId,
          timestamp: new Date().toISOString(),
          source: 'n8n_live_workflow',
          latency_ms: Date.now() - startTime
        };

        this.recordAudit(payload, normalized, productName);
        return normalized;
      } catch (err: any) {
        // Fail-closed! Do NOT allow on errors or timeouts.
        const response: FirewallResponseContract = {
          request_id: requestId,
          decision: 'BLOCK',
          reason: `Firewall unavailable — action not executed. (${err.message || 'Timeout / Network Error'})`,
          requires_approval: false,
          approval_id: null,
          expected_amount: expectedAmount,
          requested_amount: payload.requested_amount,
          recipient_email: payload.recipient_email,
          session_id: sessionId,
          timestamp: new Date().toISOString(),
          source: 'n8n_live_workflow',
          latency_ms: Date.now() - startTime,
          error: err.message
        };
        this.recordAudit(payload, response, productName);
        return response;
      }
    }

    // Step 3: Demo Simulation Mode (Server-side Rule Engine)
    const demoResponse = this.evaluateRulesLocally(payload, expectedAmount, productName, requestId, sessionId);
    demoResponse.latency_ms = Date.now() - startTime;
    this.recordAudit(payload, demoResponse, productName);
    return demoResponse;
  }

  /**
   * Dispatches payload to external n8n webhook with fail-closed timeout
   */
  private async callExternalN8nWebhook(url: string, payload: any): Promise<Partial<FirewallResponseContract>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, serverStore.settings.webhook_timeout_ms);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Firewall-Origin': 'ai-agent-testing-lab'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`n8n webhook responded with HTTP ${response.status} ${response.statusText}`);
      }

      const json = await response.json();

      // Normalize n8n response contract
      const decision: FirewallDecision = (json.decision || (json.allow ? 'ALLOW' : 'BLOCK')).toUpperCase();
      const requiresApproval = Boolean(json.requires_approval || decision === 'APPROVAL_REQUIRED');

      return {
        decision: ['ALLOW', 'APPROVAL_REQUIRED', 'BLOCK', 'ALERT'].includes(decision) ? decision : 'BLOCK',
        reason: json.reason || 'n8n workflow executed rule evaluation.',
        requires_approval: requiresApproval,
        approval_id: json.approval_id || (requiresApproval ? `appr_${Date.now()}` : null)
      };
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('Connection to n8n webhook timed out (>3500ms). Fail-closed policy applied.');
      }
      throw err;
    }
  }

  /**
   * Local rule engine for Demo Mode
   */
  private evaluateRulesLocally(
    payload: FirewallRequestPayload,
    expectedAmount: number | undefined,
    productName: string | undefined,
    requestId: string,
    sessionId: string
  ): FirewallResponseContract {
    let decision: FirewallDecision = 'ALLOW';
    let reason = 'Action verified against active security policies.';
    let requiresApproval = false;
    let approvalId: string | null = null;

    if (payload.action_type === 'PAYMENT_VALIDATION') {
      const requested = Number(payload.requested_amount);
      const expected = expectedAmount !== undefined ? expectedAmount : requested;

      if (payload.scenario === 'EXCESSIVE_ANONYMOUS') {
        decision = 'BLOCK';
        reason = `Rate limit breach: Excessive unauthenticated purchases detected (Session: ${sessionId}). Maximum allowance of ${serverStore.settings.anonymous_purchase_limit} transactions exceeded.`;
      } else if (requested !== expected) {
        decision = 'APPROVAL_REQUIRED';
        requiresApproval = true;
        approvalId = `appr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        reason = `Price Integrity Mismatch: Requested amount (₹${requested.toLocaleString('en-IN')}) does not match server ground-truth catalog price (₹${expected.toLocaleString('en-IN')}) for ${productName || 'product'}. Escalated to Human Approval Center.`;
      } else {
        decision = 'ALLOW';
        reason = `Payment verification passed: Requested amount (₹${requested.toLocaleString('en-IN')}) matches verified price for ${productName || 'item'}.`;
      }
    } else if (payload.action_type === 'EMAIL_VALIDATION') {
      const recipient = (payload.recipient_email || '').trim().toLowerCase();
      const authorized = serverStore.settings.authorized_company_email.trim().toLowerCase();

      if (recipient === authorized) {
        decision = 'ALLOW';
        reason = `Email whitelist validated: Destination address '${recipient}' matches configured corporate security contact policy.`;
      } else {
        decision = 'APPROVAL_REQUIRED';
        requiresApproval = true;
        approvalId = `appr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        reason = `Unauthorized recipient detected: Destination '${recipient}' is not on the company whitelist (${authorized}). Outbound dispatch held pending supervisor approval.`;
      }
    }

    if (requiresApproval && approvalId) {
      this.createApprovalRecord({
        id: approvalId,
        request_id: requestId,
        action_type: payload.action_type,
        status: 'PENDING',
        risk_reason: reason,
        requested_amount: payload.requested_amount,
        expected_amount: expectedAmount,
        recipient_email: payload.recipient_email,
        session_id: sessionId,
        product_id: payload.product_id,
        product_name: productName,
        created_at: new Date().toISOString(),
        can_override: true
      });
    }

    return {
      request_id: requestId,
      decision,
      reason,
      requires_approval: requiresApproval,
      approval_id: approvalId,
      expected_amount: expectedAmount,
      requested_amount: payload.requested_amount,
      recipient_email: payload.recipient_email,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      source: 'demo_simulation'
    };
  }

  private createApprovalRecord(request: ApprovalRequest) {
    serverStore.approvals.unshift(request);
  }

  private recordAudit(
    payload: FirewallRequestPayload,
    response: FirewallResponseContract,
    productName?: string
  ) {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      request_id: response.request_id,
      action_type: payload.action_type,
      decision: response.decision,
      reason: response.reason,
      timestamp: response.timestamp,
      session_id: response.session_id || payload.session_id,
      source: response.source,
      requires_approval: response.requires_approval,
      approval_status: response.requires_approval ? 'PENDING' : 'N/A',
      details: {
        product_id: payload.product_id,
        product_name: productName,
        requested_amount: payload.requested_amount,
        expected_amount: response.expected_amount,
        recipient_email: payload.recipient_email,
        anonymous_session: payload.anonymous_session,
        scenario: payload.scenario
      }
    };

    serverStore.recordAuditLog(entry);
  }
}

export const firewallEngine = new FirewallEngine();
