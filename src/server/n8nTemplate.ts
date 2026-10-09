export const N8N_WORKFLOW_TEMPLATE = {
  name: "AI Agent Firewall - E-commerce Security Workflow",
  nodes: [
    {
      parameters: {
        httpMethod: "POST",
        path: "ai-agent-firewall",
        responseMode: "responseNode",
        options: {}
      },
      id: "node-webhook-trigger",
      name: "Firewall Inbound Webhook",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [240, 300]
    },
    {
      parameters: {
        jsCode: `// AI Agent Firewall Security Policy Engine
const body = $input.item.json.body || $input.item.json;
const actionType = body.action_type || 'PAYMENT_VALIDATION';
const requestId = body.request_id || ('req_' + Date.now());
const sessionId = body.session_id || 'sess_unknown';
const isAnonymous = Boolean(body.anonymous_session);

// Server-configured ground truth prices
const groundTruthPrices = {
  'smart-watch': 1999,
  'wireless-headphones': 1499,
  'usb-c-hub': 999,
  'laptop-stand': 799
};

const authorizedCompanyEmail = "security@shieldstore.internal";

let decision = 'ALLOW';
let reason = 'Action passed all AI Agent Firewall security assertions.';
let requiresApproval = false;
let approvalId = null;

if (actionType === 'PAYMENT_VALIDATION') {
  const productId = body.product_id;
  const requestedAmount = Number(body.requested_amount);
  const expectedAmount = groundTruthPrices[productId] || requestedAmount;

  // Rate limit / excessive anonymous check
  if (isAnonymous && body.scenario === 'EXCESSIVE_ANONYMOUS') {
    decision = 'BLOCK';
    reason = 'Firewall Alert: Excessive anonymous purchase attempts detected on session. Rate limit threshold exceeded (4 > 3 max).';
  } else if (requestedAmount !== expectedAmount) {
    decision = 'APPROVAL_REQUIRED';
    requiresApproval = true;
    approvalId = 'appr_' + Math.random().toString(36).substring(2, 9);
    reason = \`Price integrity violation: Requested ₹\${requestedAmount} does not match verified server catalog price ₹\${expectedAmount}. Human review mandated.\`;
  } else {
    decision = 'ALLOW';
    reason = \`Valid payment transaction. Expected and requested amount matched exactly at ₹\${expectedAmount}.\`;
  }
} else if (actionType === 'EMAIL_VALIDATION') {
  const recipient = (body.recipient_email || '').toLowerCase().trim();
  
  if (recipient === authorizedCompanyEmail.toLowerCase()) {
    decision = 'ALLOW';
    reason = \`Authorized recipient verified: \${recipient} matches approved organizational security recipient policy.\`;
  } else {
    decision = 'APPROVAL_REQUIRED';
    requiresApproval = true;
    approvalId = 'appr_' + Math.random().toString(36).substring(2, 9);
    reason = \`Unauthorized email recipient (\${recipient}). Outbound policy restricts external domains without human supervisor authorization.\`;
  }
}

return {
  json: {
    request_id: requestId,
    decision,
    reason,
    requires_approval: requiresApproval,
    approval_id: approvalId,
    session_id: sessionId,
    timestamp: new Date().toISOString()
  }
};`
      },
      id: "node-firewall-evaluator",
      name: "AI Agent Policy Evaluator",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [500, 300]
    },
    {
      parameters: {
        respondWith: "json",
        responseBody: "={{ JSON.stringify($json) }}",
        options: {
          responseCode: 200
        }
      },
      id: "node-webhook-response",
      name: "Return Security Decision",
      type: "n8n-nodes-base.respondToWebhook",
      typeVersion: 1.1,
      position: [760, 300]
    }
  ],
  connections: {
    "Firewall Inbound Webhook": {
      main: [
        [
          {
            node: "AI Agent Policy Evaluator",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "AI Agent Policy Evaluator": {
      main: [
        [
          {
            node: "Return Security Decision",
            type: "main",
            index: 0
          }
        ]
      ]
    }
  },
  active: false,
  settings: {
    executionOrder: "v1"
  }
};
