export type FirewallDecision = 'ALLOW' | 'APPROVAL_REQUIRED' | 'BLOCK' | 'ALERT';

export type ActionType = 'PAYMENT_VALIDATION' | 'EMAIL_VALIDATION' | 'APPROVAL_DECISION' | 'STATUS_CHECK';

export type FirewallMode = 'demo' | 'live';

export interface Product {
  id: string;
  name: string;
  price: number; // In INR (₹)
  description: string;
  category: string;
  image: string;
  features: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface FirewallRequestPayload {
  request_id: string;
  action_type: ActionType;
  session_id: string;
  product_id?: string;
  requested_amount?: number;
  expected_amount?: number;
  recipient_email?: string;
  sender_email?: string;
  subject?: string;
  message_preview?: string;
  anonymous_session?: boolean;
  timestamp: string;
  scenario?: string;
  mode?: FirewallMode;
}

export interface FirewallResponseContract {
  request_id: string;
  decision: FirewallDecision;
  reason: string;
  requires_approval: boolean;
  approval_id?: string | null;
  expected_amount?: number;
  requested_amount?: number;
  recipient_email?: string;
  session_id?: string;
  timestamp: string;
  source: 'n8n_live_workflow' | 'server_rule_engine' | 'demo_simulation';
  latency_ms?: number;
  error?: string | null;
}

export interface ApprovalRequest {
  id: string;
  request_id: string;
  action_type: ActionType;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  risk_reason: string;
  requested_amount?: number;
  expected_amount?: number;
  recipient_email?: string;
  session_id: string;
  product_id?: string;
  product_name?: string;
  created_at: string;
  decided_at?: string;
  reviewer_name?: string;
  reviewer_comment?: string;
  can_override: boolean;
  override_prevention_reason?: string;
}

export interface AuditLogEntry {
  id: string;
  request_id: string;
  action_type: ActionType;
  decision: FirewallDecision;
  reason: string;
  timestamp: string;
  session_id: string;
  source: 'n8n_live_workflow' | 'server_rule_engine' | 'demo_simulation';
  requires_approval: boolean;
  approval_status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'N/A';
  reviewer_comment?: string;
  details: {
    product_id?: string;
    product_name?: string;
    requested_amount?: number;
    expected_amount?: number;
    recipient_email?: string;
    anonymous_session?: boolean;
    n8n_response_status?: number;
    scenario?: string;
  };
}

export interface SystemSettings {
  authorized_company_email: string;
  anonymous_purchase_limit: number;
  n8n_webhook_url: string;
  firewall_mode: FirewallMode;
  fail_closed_enabled: boolean;
  webhook_timeout_ms: number;
  last_tested_status?: 'connected' | 'failed' | 'not_configured';
  last_tested_at?: string;
}

export interface DashboardStats {
  total_requests: number;
  allowed_count: number;
  blocked_count: number;
  pending_approvals_count: number;
  incorrect_price_attempts: number;
  unauthorized_email_attempts: number;
  anonymous_limit_violations: number;
  recent_activity: AuditLogEntry[];
  chart_data: {
    labels: string[];
    allowed: number[];
    blocked: number[];
    approval_required: number[];
  };
}

export interface TestScenarioDefinition {
  id: string;
  number: number;
  title: string;
  description: string;
  category: 'PAYMENT' | 'EMAIL' | 'SYSTEM';
  expectedDecision: FirewallDecision;
  expectedBehavior: string;
  defaultPayload: Partial<FirewallRequestPayload>;
}
