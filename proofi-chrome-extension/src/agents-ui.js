/**
 * Agents UI — Proofi Extension
 * 
 * Handles the "Agents" tab in the wallet popup:
 * - List connected agents
 * - Approve pending agent requests
 * - Revoke agent access
 */

// Initialize agents tab
function initAgentsUI() {
  loadAgents();
  checkPendingApproval();
  
  // Tab click handler
  document.getElementById('tab-agents')?.addEventListener('click', () => {
    showScreen('screen-agents');
    loadAgents();
  });
}

// Load and display connected agents
async function loadAgents() {
  const container = document.getElementById('agents-list');
  if (!container) return;
  
  chrome.runtime.sendMessage({ type: 'GET_AGENTS' }, (response) => {
    const agents = response?.agents || [];
    
    if (agents.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="text-display" style="font-size: 2rem; color: var(--gray-400);">🤖</div>
          <div class="text-label mt-2">NO AGENTS CONNECTED</div>
          <p class="text-body-sm text-muted mt-1">
            When an app requests access, you'll see it here.
          </p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = agents.map(agent => `
      <div class="agent-card ${agent.active ? '' : 'agent-expired'}">
        <div class="agent-header">
          <div class="agent-icon">🤖</div>
          <div class="agent-info">
            <div class="text-mono text-sm">${escapeHtml(agent.name)}</div>
            <div class="text-body-sm text-muted">${agent.agentId}</div>
          </div>
        </div>
        <div class="agent-scopes">
          ${agent.scopes.map(s => `<span class="scope-badge">${escapeHtml(s)}</span>`).join('')}
        </div>
        <div class="agent-meta">
          <span class="text-body-sm text-muted">
            ${agent.active ? 'Active' : 'Expired'} · 
            Expires ${formatTime(agent.expiresAt)}
          </span>
        </div>
        <button class="btn-danger btn-sm" onclick="revokeAgent('${escapeHtml(agent.agentId)}')">
          REVOKE
        </button>
      </div>
    `).join('');
  });
}

// Check for pending agent approval
function checkPendingApproval() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('view') !== 'agent-approve') return;
  
  chrome.storage.local.get('proofi_pending_agent', (data) => {
    const pending = data.proofi_pending_agent;
    if (!pending) return;
    
    showApprovalModal(pending);
  });
}

// Show approval modal
function showApprovalModal(agent) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-card">
      <div class="text-label" style="color: var(--cyan);">AGENT REQUEST</div>
      <h2 class="text-display mt-2">${escapeHtml(agent.name)}</h2>
      <p class="text-body-sm text-muted mt-1">wants to connect</p>
      
      <div class="scopes-request mt-4">
        <div class="text-label mb-2">REQUESTED ACCESS</div>
        <div class="scopes-list">
          ${agent.scopes.map(s => `
            <div class="scope-item">
              <span class="scope-icon">${getScopeIcon(s)}</span>
              <span class="scope-name">${escapeHtml(s)}</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="modal-actions mt-4">
        <button class="btn-secondary" onclick="rejectAgent()">REJECT</button>
        <button class="btn-primary" onclick="approveAgent('${escapeHtml(agent.agentId)}', '${escapeHtml(agent.name)}', ${JSON.stringify(agent.scopes)})">
          APPROVE
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// Approve agent
function approveAgent(agentId, name, scopes) {
  chrome.runtime.sendMessage({
    type: 'APPROVE_AGENT',
    payload: { agentId, name, scopes, expiresIn: 86400000 } // 24h
  }, (response) => {
    if (response?.ok) {
      closeModal();
      showToast('Agent approved ✓');
      loadAgents();
    }
  });
}

// Reject agent
function rejectAgent() {
  chrome.storage.local.remove('proofi_pending_agent', () => {
    closeModal();
    window.close();
  });
}

// Revoke agent
function revokeAgent(agentId) {
  if (!confirm('Revoke access for this agent?')) return;
  
  chrome.runtime.sendMessage({
    type: 'REVOKE_AGENT',
    payload: { agentId }
  }, (response) => {
    if (response?.ok) {
      showToast('Agent revoked');
      loadAgents();
    }
  });
}

// Helpers
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatTime(ts) {
  const date = new Date(ts);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getScopeIcon(scope) {
  const icons = {
    age: '🎂',
    calendar: '📅',
    identity: '🪪',
    health: '🏥',
    email: '📧',
  };
  return icons[scope] || '📦';
}

function closeModal() {
  document.querySelector('.modal-overlay')?.remove();
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Show screen helper
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
  document.getElementById(screenId).style.display = 'block';
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAgentsUI);
} else {
  initAgentsUI();
}

// Wire up agents button
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-agents')?.addEventListener('click', () => {
    showScreen('screen-agents');
    loadAgents();
  });
  
  document.getElementById('btn-agents-back')?.addEventListener('click', () => {
    showScreen('screen-dashboard');
  });
});
