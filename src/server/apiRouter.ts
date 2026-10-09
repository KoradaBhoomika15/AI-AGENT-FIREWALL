import { Router, Request, Response } from 'express';
import { serverStore } from './store';
import { firewallEngine } from './firewallEngine';
import { N8N_WORKFLOW_TEMPLATE } from './n8nTemplate';
import { FirewallRequestPayload } from '../types';

export const apiRouter = Router();

// 1. System Configuration & Settings
apiRouter.get('/config', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: serverStore.settings
  });
});

apiRouter.post('/config', (req: Request, res: Response) => {
  const {
    authorized_company_email,
    anonymous_purchase_limit,
    n8n_webhook_url,
    firewall_mode,
    fail_closed_enabled
  } = req.body;

  if (authorized_company_email) {
    serverStore.settings.authorized_company_email = String(authorized_company_email).trim();
  }
  if (anonymous_purchase_limit !== undefined) {
    serverStore.settings.anonymous_purchase_limit = Math.max(1, Number(anonymous_purchase_limit));
  }
  if (n8n_webhook_url !== undefined) {
    serverStore.settings.n8n_webhook_url = String(n8n_webhook_url).trim();
  }
  if (firewall_mode && ['demo', 'live'].includes(firewall_mode)) {
    serverStore.settings.firewall_mode = firewall_mode;
  }
  if (fail_closed_enabled !== undefined) {
    serverStore.settings.fail_closed_enabled = Boolean(fail_closed_enabled);
  }

  res.json({
    success: true,
    message: 'Configuration saved successfully.',
    data: serverStore.settings
  });
});

// Test n8n webhook connectivity
apiRouter.post('/config/test-webhook', async (req: Request, res: Response) => {
  const url = req.body.url || serverStore.settings.n8n_webhook_url;
  if (!url) {
    res.status(400).json({
      success: false,
      message: 'No webhook URL provided for testing.'
    });
    return;
  }

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const testPayload = {
      request_id: `ping_${Date.now()}`,
      action_type: 'STATUS_CHECK',
      session_id: 'probe_check',
      timestamp: new Date().toISOString(),
      scenario: 'WEBHOOK_PROBE'
    };

    const webhookRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
      signal: controller.signal
    });

    clearTimeout(timeout);
    const latency = Date.now() - startTime;

    if (webhookRes.ok) {
      serverStore.settings.last_tested_status = 'connected';
      serverStore.settings.last_tested_at = new Date().toISOString();
      res.json({
        success: true,
        status: 'connected',
        latency_ms: latency,
        message: `Connected successfully to n8n Webhook (${latency}ms latency).`
      });
    } else {
      serverStore.settings.last_tested_status = 'failed';
      serverStore.settings.last_tested_at = new Date().toISOString();
      res.status(502).json({
        success: false,
        status: 'failed',
        latency_ms: latency,
        message: `Webhook returned HTTP ${webhookRes.status} ${webhookRes.statusText}`
      });
    }
  } catch (err: any) {
    serverStore.settings.last_tested_status = 'failed';
    serverStore.settings.last_tested_at = new Date().toISOString();
    res.status(504).json({
      success: false,
      status: 'failed',
      message: err.name === 'AbortError' ? 'Webhook connection timed out (>3500ms).' : `Network error: ${err.message}`
    });
  }
});

// 2. Main Firewall Evaluation
apiRouter.post('/firewall/evaluate', async (req: Request, res: Response) => {
  try {
    const payload: FirewallRequestPayload = req.body;

    if (!payload.action_type) {
      res.status(400).json({
        success: false,
        message: 'Missing mandatory action_type.'
      });
      return;
    }

    const decisionResponse = await firewallEngine.evaluate(payload);
    res.json({
      success: true,
      data: decisionResponse
    });
  } catch (err: any) {
    // Fail closed
    res.status(500).json({
      success: false,
      error: 'Firewall unavailable — action not executed.',
      details: err.message
    });
  }
});

// 3. Human Approval Center
apiRouter.get('/approvals', (req: Request, res: Response) => {
  const status = req.query.status as string;
  let items = serverStore.approvals;
  if (status && status !== 'ALL') {
    items = items.filter(a => a.status === status);
  }
  res.json({
    success: true,
    data: items
  });
});

apiRouter.post('/approvals/:id/decide', (req: Request, res: Response) => {
  const { id } = req.params;
  const { decision, reviewer_comment, reviewer_name } = req.body;

  const item = serverStore.approvals.find(a => a.id === id);
  if (!item) {
    res.status(404).json({
      success: false,
      message: `Approval request ${id} not found.`
    });
    return;
  }

  if (item.status !== 'PENDING') {
    res.status(400).json({
      success: false,
      message: `Approval request ${id} has already been resolved as ${item.status}.`
    });
    return;
  }

  // Mandatory rejection comment rule
  if (decision === 'REJECT' && (!reviewer_comment || String(reviewer_comment).trim().length < 5)) {
    res.status(400).json({
      success: false,
      message: 'A detailed reviewer explanation is strictly mandatory when rejecting a pending security request.'
    });
    return;
  }

  item.status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  item.decided_at = new Date().toISOString();
  item.reviewer_comment = reviewer_comment || (decision === 'APPROVE' ? 'Approved by Security Operations reviewer.' : 'Rejected.');
  item.reviewer_name = reviewer_name || 'SOC Analyst (Admin)';

  // Update corresponding audit log entry
  const auditLog = serverStore.auditLogs.find(l => l.request_id === item.request_id);
  if (auditLog) {
    auditLog.approval_status = item.status;
    auditLog.reviewer_comment = item.reviewer_comment;
    if (decision === 'REJECT') {
      auditLog.decision = 'BLOCK';
      auditLog.reason = `Human reviewer rejected transaction: ${item.reviewer_comment}`;
    } else {
      auditLog.decision = 'ALLOW';
      auditLog.reason = `Human reviewer authorized exception: ${item.reviewer_comment}`;
    }
  }

  res.json({
    success: true,
    message: `Request successfully ${item.status.toLowerCase()}.`,
    data: item
  });
});

// 4. Audit Logs
apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  const { search, action_type, decision } = req.query;
  let logs = serverStore.auditLogs;

  if (action_type && action_type !== 'ALL') {
    logs = logs.filter(l => l.action_type === action_type);
  }
  if (decision && decision !== 'ALL') {
    logs = logs.filter(l => l.decision === decision);
  }
  if (search) {
    const q = String(search).toLowerCase();
    logs = logs.filter(l =>
      l.request_id.toLowerCase().includes(q) ||
      l.reason.toLowerCase().includes(q) ||
      l.session_id.toLowerCase().includes(q) ||
      (l.details.recipient_email && l.details.recipient_email.toLowerCase().includes(q)) ||
      (l.details.product_name && l.details.product_name.toLowerCase().includes(q))
    );
  }

  res.json({
    success: true,
    data: logs
  });
});

// 5. Security Dashboard Stats
apiRouter.get('/dashboard/stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: serverStore.getDashboardStats()
  });
});

// 6. Reset Anonymous Session Counter
apiRouter.post('/session/reset', (req: Request, res: Response) => {
  const { session_id } = req.body;
  if (session_id) {
    serverStore.resetAnonymousSession(session_id);
  }
  res.json({
    success: true,
    message: `Session '${session_id}' attempt counter reset.`
  });
});

// 7. n8n Sample Workflow Template
apiRouter.get('/n8n/workflow-template', (req: Request, res: Response) => {
  res.json(N8N_WORKFLOW_TEMPLATE);
});
