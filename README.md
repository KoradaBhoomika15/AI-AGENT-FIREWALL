# AI Agent Firewall – Security Testing Lab
### Dummy E-commerce Security Testing Platform for n8n AI Agent Workflows

A cybersecurity demonstration platform and testing lab simulating an e-commerce storefront protected by an **AI Agent Firewall** and rule engine. Every payment checkout and outbound email is intercepted and evaluated before execution.

---

## 1. Key Features

- **Storefront & Catalog**: 4 sample hardware products with server-locked fixed pricing (Smart Watch ₹1,999, ANC Headphones ₹1,499, USB-C Hub ₹999, Laptop Stand ₹799).
- **Payment Security Firewall**: Detects catalog price tampering, enforces server pricing invariants, tracks unauthenticated purchase velocities, and routes suspicious transactions to human reviewers.
- **Email Recipient Security Firewall**: Evaluates outbound email dispatch against a configured corporate whitelist (`security@shieldstore.internal`), holding foreign/untrusted domains for approval.
- **Firewall Testing Lab**: 9 pre-engineered test scenarios with side-by-side request and response JSON inspection, telemetry metrics, and fail-closed timeout verification.
- **Human Approval Center**: Tier-2 SOC dashboard for pending approvals, with mandatory reviewer comments on rejection and immutable event logging.
- **Security Monitoring Dashboard**: Real-time KPI counters, verdict distribution bars (Allowed vs Blocked vs Pending), threat breakdown vectors, and chronological event timeline.
- **Audit Logs**: Cryptographically formatted, searchable audit trail with deep JSON payload inspection and JSON export.
- **n8n Webhook Integration**: Native webhook dispatcher with fail-closed timeout handling and importable workflow blueprint JSON.

---

## 2. Quickstart & Local Setup

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation & Run
```bash
# 1. Install dependencies
npm install

# 2. Run in development mode (starts on port 3000)
npm run dev

# 3. For production build & standalone server
npm run build
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Connecting to n8n Webhook

1. In your n8n workspace, create a new workflow.
2. Add a **Webhook** node set to:
   - **HTTP Method**: `POST`
   - **Path**: `ai-agent-firewall`
   - **Response Mode**: `Using 'Respond to Webhook' Node`
3. Download or copy the workflow JSON from the **Settings** or **Testing Lab** page in this app, or import `src/server/n8nTemplate.ts`.
4. Copy the Test or Production Webhook URL from n8n (e.g. `https://your-n8n.com/webhook/ai-agent-firewall`).
5. In this app, navigate to **Settings** $\to$ Paste into **VITE_N8N_FIREWALL_WEBHOOK_URL** $\to$ Click **Test Webhook** $\to$ Click **Save & Enforce Policies**.
6. Switch the mode toggle in the top banner or Settings to **Live Firewall Mode**.

---

## 4. API Endpoints & Contract Specification

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/firewall/evaluate` | Evaluates payment or email actions through firewall |
| `GET` | `/api/approvals` | Returns pending/resolved human approval tickets |
| `POST` | `/api/approvals/:id/decide` | Submits reviewer decision (`APPROVE` or `REJECT`) |
| `GET` | `/api/audit-logs` | Fetches searchable audit logs with filters |
| `GET` | `/api/dashboard/stats` | Aggregated security metrics and activity feed |
| `GET` | `/api/config` | Retrieves current policies and firewall mode |
| `POST` | `/api/config` | Updates whitelist email, anonymous limit, mode |
| `POST` | `/api/config/test-webhook` | Pings external n8n webhook with a probe payload |
| `POST` | `/api/session/reset` | Resets anonymous attempt velocity counters |
| `GET` | `/api/n8n/workflow-template`| Returns the importable n8n workflow JSON |

### Webhook Request Contract (App $\to$ n8n)
```json
{
  "request_id": "req_1740000000000_abc123",
  "action_type": "PAYMENT_VALIDATION",
  "session_id": "sess_f89a2bc1",
  "product_id": "smart-watch",
  "requested_amount": 1999,
  "expected_amount": 1999,
  "anonymous_session": false,
  "timestamp": "2026-10-09T09:40:00.000Z",
  "scenario": "EXACT_PRICE_PURCHASE"
}
```

### Webhook Response Contract (n8n $\to$ App)
```json
{
  "request_id": "req_1740000000000_abc123",
  "decision": "ALLOW",
  "reason": "Payment transaction passed all security assertions.",
  "requires_approval": false,
  "approval_id": null
}
```

---

## 5. Security Invariant Architecture

- **Fail-Closed Behavior**: If external n8n is unreachable, times out (>3500ms), or errors, the firewall returns `BLOCK` with `"Firewall unavailable — action not executed."`
- **Server Ground Truth**: Fixed catalog prices cannot be overridden by frontend inputs.
- **Mandatory Reviewer Notes**: Rejections require a minimum 5-character reason stored in the audit log.
- **Zero Real Credentials**: All payments and emails are simulated sandboxes.
