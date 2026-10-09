import {
  ApprovalRequest,
  AuditLogEntry,
  DashboardStats,
  SystemSettings
} from '../types';
import { SERVER_PRODUCTS } from '../data/products';

class ServerDataStore {
  public settings: SystemSettings = {
    authorized_company_email: 'security@shieldstore.internal',
    anonymous_purchase_limit: 3,
    n8n_webhook_url: process.env.VITE_N8N_FIREWALL_WEBHOOK_URL || '',
    firewall_mode: 'demo',
    fail_closed_enabled: true,
    webhook_timeout_ms: 3500,
    last_tested_status: 'not_configured',
    last_tested_at: undefined
  };

  // Tracks anonymous attempts per session_id
  public anonymousAttempts: Map<string, number> = new Map();

  // Audit logs memory buffer
  public auditLogs: AuditLogEntry[] = [];

  // Approval requests
  public approvals: ApprovalRequest[] = [];

  constructor() {
    this.seedInitialDemoData();
  }

  private seedInitialDemoData() {
    const now = Date.now();
    
    // Seed sample audit logs with explicit Demo label
    this.auditLogs = [
      {
        id: 'audit_init_1',
        request_id: 'req_demo_exact_001',
        action_type: 'PAYMENT_VALIDATION',
        decision: 'ALLOW',
        reason: 'Payment validated: ₹1,999 matches server fixed catalog price for TitanPulse Smart Watch.',
        timestamp: new Date(now - 1000 * 60 * 45).toISOString(),
        session_id: 'sess_demo_alpha',
        source: 'demo_simulation',
        requires_approval: false,
        approval_status: 'N/A',
        details: {
          product_id: 'smart-watch',
          product_name: 'TitanPulse Smart Watch',
          requested_amount: 1999,
          expected_amount: 1999,
          anonymous_session: false,
          scenario: 'EXACT_PRICE_PURCHASE'
        }
      },
      {
        id: 'audit_init_2',
        request_id: 'req_demo_price_tamper_002',
        action_type: 'PAYMENT_VALIDATION',
        decision: 'APPROVAL_REQUIRED',
        reason: 'Price discrepancy detected: Client submitted ₹1,200 for ₹1,499 Wireless Headphones. Tamper risk flagged.',
        timestamp: new Date(now - 1000 * 60 * 30).toISOString(),
        session_id: 'sess_demo_beta',
        source: 'demo_simulation',
        requires_approval: true,
        approval_status: 'PENDING',
        details: {
          product_id: 'wireless-headphones',
          product_name: 'AcousticShield ANC Headphones',
          requested_amount: 1200,
          expected_amount: 1499,
          anonymous_session: false,
          scenario: 'PRICE_TAMPERING'
        }
      },
      {
        id: 'audit_init_3',
        request_id: 'req_demo_email_auth_003',
        action_type: 'EMAIL_VALIDATION',
        decision: 'ALLOW',
        reason: 'Authorized recipient confirmed: security@shieldstore.internal belongs to authorized corporate whitelist.',
        timestamp: new Date(now - 1000 * 60 * 20).toISOString(),
        session_id: 'sess_demo_gamma',
        source: 'demo_simulation',
        requires_approval: false,
        approval_status: 'N/A',
        details: {
          recipient_email: 'security@shieldstore.internal',
          scenario: 'AUTHORIZED_EMAIL'
        }
      },
      {
        id: 'audit_init_4',
        request_id: 'req_demo_email_unauth_004',
        action_type: 'EMAIL_VALIDATION',
        decision: 'APPROVAL_REQUIRED',
        reason: 'External untrusted recipient: vendor-external@darkleak.net rejected by automatic outbound whitelist.',
        timestamp: new Date(now - 1000 * 60 * 10).toISOString(),
        session_id: 'sess_demo_delta',
        source: 'demo_simulation',
        requires_approval: true,
        approval_status: 'PENDING',
        details: {
          recipient_email: 'vendor-external@darkleak.net',
          scenario: 'UNAUTHORIZED_EMAIL'
        }
      },
      {
        id: 'audit_init_5',
        request_id: 'req_demo_anon_burst_005',
        action_type: 'PAYMENT_VALIDATION',
        decision: 'BLOCK',
        reason: 'Anonymous purchase frequency breach: Session exceeded limit of 3 unauthenticated checkouts.',
        timestamp: new Date(now - 1000 * 60 * 5).toISOString(),
        session_id: 'sess_anon_attacker_99',
        source: 'demo_simulation',
        requires_approval: false,
        approval_status: 'N/A',
        details: {
          product_id: 'usb-c-hub',
          product_name: 'NexusPort 7-in-1 USB-C Hub',
          requested_amount: 999,
          expected_amount: 999,
          anonymous_session: true,
          scenario: 'ANONYMOUS_RATE_LIMIT'
        }
      }
    ];

    // Seed pending approvals
    this.approvals = [
      {
        id: 'appr_demo_001',
        request_id: 'req_demo_price_tamper_002',
        action_type: 'PAYMENT_VALIDATION',
        status: 'PENDING',
        risk_reason: 'Underpayment discrepancy: Client attempted to charge ₹1,200 for ₹1,499 AcousticShield ANC Headphones.',
        requested_amount: 1200,
        expected_amount: 1499,
        session_id: 'sess_demo_beta',
        product_id: 'wireless-headphones',
        product_name: 'AcousticShield ANC Headphones',
        created_at: new Date(now - 1000 * 60 * 30).toISOString(),
        can_override: true
      },
      {
        id: 'appr_demo_002',
        request_id: 'req_demo_email_unauth_004',
        action_type: 'EMAIL_VALIDATION',
        status: 'PENDING',
        risk_reason: 'Recipient vendor-external@darkleak.net not recognized in organizational whitelist. Outbound relay requires SOC approval.',
        recipient_email: 'vendor-external@darkleak.net',
        session_id: 'sess_demo_delta',
        created_at: new Date(now - 1000 * 60 * 10).toISOString(),
        can_override: true
      }
    ];
  }

  public recordAuditLog(entry: AuditLogEntry) {
    this.auditLogs.unshift(entry);
    // Keep reasonable max memory buffer (e.g. 500 items)
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }

  public getDashboardStats(): DashboardStats {
    let allowedCount = 0;
    let blockedCount = 0;
    let pendingCount = 0;
    let incorrectPriceAttempts = 0;
    let unauthorizedEmailAttempts = 0;
    let anonymousLimitViolations = 0;

    for (const log of this.auditLogs) {
      if (log.decision === 'ALLOW') allowedCount++;
      if (log.decision === 'BLOCK' || log.decision === 'ALERT') blockedCount++;
      if (log.decision === 'APPROVAL_REQUIRED') pendingCount++;

      if (log.action_type === 'PAYMENT_VALIDATION') {
        const details = log.details;
        if (details?.requested_amount !== undefined && details?.expected_amount !== undefined && details.requested_amount !== details.expected_amount) {
          incorrectPriceAttempts++;
        }
        if (details?.anonymous_session && (log.decision === 'BLOCK' || log.decision === 'ALERT')) {
          anonymousLimitViolations++;
        }
      }

      if (log.action_type === 'EMAIL_VALIDATION') {
        if (log.decision === 'APPROVAL_REQUIRED' || log.decision === 'BLOCK') {
          unauthorizedEmailAttempts++;
        }
      }
    }

    // Chart distribution over 6 time slices
    const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', 'Now'];
    const allowed = [12, 19, 15, 22, 28, Math.max(1, allowedCount)];
    const blocked = [3, 5, 2, 8, 4, Math.max(1, blockedCount)];
    const approval = [2, 4, 3, 5, 6, Math.max(1, pendingCount)];

    return {
      total_requests: this.auditLogs.length,
      allowed_count: allowedCount,
      blocked_count: blockedCount,
      pending_approvals_count: this.approvals.filter(a => a.status === 'PENDING').length,
      incorrect_price_attempts: incorrectPriceAttempts,
      unauthorized_email_attempts: unauthorizedEmailAttempts,
      anonymous_limit_violations: anonymousLimitViolations,
      recent_activity: this.auditLogs.slice(0, 10),
      chart_data: {
        labels: hours,
        allowed,
        blocked,
        approval_required: approval
      }
    };
  }

  public resetAnonymousSession(sessionId: string) {
    this.anonymousAttempts.delete(sessionId);
  }

  public getAnonymousCount(sessionId: string): number {
    return this.anonymousAttempts.get(sessionId) || 0;
  }

  public incrementAnonymousCount(sessionId: string): number {
    const current = this.getAnonymousCount(sessionId);
    const next = current + 1;
    this.anonymousAttempts.set(sessionId, next);
    return next;
  }
}

export const serverStore = new ServerDataStore();
