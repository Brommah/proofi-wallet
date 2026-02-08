/**
 * Proofi Token UI
 * 
 * UI components for the Capability Token Engine:
 * - Token list with status
 * - Grant access modal
 * - Revoke confirmation
 * - Token export/share
 */

const TokenUI = (() => {
  // ── State ────────────────────────────────────────────────────────

  let modalContainer = null;
  let currentTab = null;

  // ── Initialize ───────────────────────────────────────────────────

  async function init() {
    // Initialize KeyManager (creates keys if needed)
    await KeyManager.initialize();
    
    // Create modal container if not exists
    if (!document.getElementById('tokenModalContainer')) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'tokenModalContainer';
      document.body.appendChild(modalContainer);
    } else {
      modalContainer = document.getElementById('tokenModalContainer');
    }

    console.log('[TokenUI] Initialized');
  }

  // ── Render Token Panel ───────────────────────────────────────────

  async function renderTokenPanel(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    currentTab = containerId;

    // Get stats and tokens
    const stats = await CapabilityTokenEngine.getStats();
    const tokens = await CapabilityTokenEngine.getAllTokens();
    const activeTokens = tokens.filter(t => t.status === 'active' && !t.isExpired && !t.isRevoked);

    container.innerHTML = `
      <div class="token-panel">
        <!-- Stats Bar -->
        <div class="token-stats">
          <div class="token-stat">
            <span class="token-stat-value">${stats.active}</span>
            <span class="token-stat-label">Active</span>
          </div>
          <div class="token-stat">
            <span class="token-stat-value">${stats.uniqueGrantees}</span>
            <span class="token-stat-label">Agents</span>
          </div>
          <div class="token-stat">
            <span class="token-stat-value">${stats.expired + stats.revoked}</span>
            <span class="token-stat-label">Expired</span>
          </div>
        </div>

        <!-- Grant Button -->
        <button class="btn btn-primary btn-block" id="grantAccessBtn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Grant Access to Agent
        </button>

        <!-- Token List -->
        <div class="token-list" id="tokenList">
          ${activeTokens.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">🔐</div>
              <div class="empty-state-text">
                No active access tokens.<br>
                Grant access to AI agents to share your data securely.
              </div>
            </div>
          ` : activeTokens.map(token => renderTokenCard(token)).join('')}
        </div>

        ${tokens.filter(t => t.isExpired || t.isRevoked).length > 0 ? `
          <button class="btn btn-ghost btn-sm btn-block" id="showHistoryBtn">
            Show History (${tokens.filter(t => t.isExpired || t.isRevoked).length})
          </button>
        ` : ''}
      </div>
    `;

    // Attach event listeners
    document.getElementById('grantAccessBtn')?.addEventListener('click', showGrantModal);
    document.getElementById('showHistoryBtn')?.addEventListener('click', () => showHistory(containerId));

    // Token card events
    container.querySelectorAll('.token-card').forEach(card => {
      const tokenId = card.dataset.tokenId;
      
      card.querySelector('.token-export-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        exportToken(tokenId);
      });
      
      card.querySelector('.token-revoke-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        showRevokeModal(tokenId);
      });
    });
  }

  // ── Render Single Token Card ─────────────────────────────────────

  function renderTokenCard(token) {
    const expiryDate = new Date(token.expiry);
    const timeLeft = getTimeLeft(token.expiry);
    const scopeIcons = token.scope.map(s => getScopeIcon(s)).join(' ');
    const permBadges = token.permissions.map(p => `<span class="perm-badge perm-${p}">${p}</span>`).join('');

    const statusClass = token.isRevoked ? 'revoked' : (token.isExpired ? 'expired' : 'active');

    return `
      <div class="token-card token-${statusClass}" data-token-id="${token.tokenId}">
        <div class="token-header">
          <div class="token-grantee">
            <span class="token-grantee-icon">🤖</span>
            <span class="token-grantee-name">${escapeHtml(token.granteeName)}</span>
          </div>
          <div class="token-status token-status-${statusClass}">
            ${statusClass === 'active' ? '✓ Active' : (statusClass === 'revoked' ? '✕ Revoked' : '⏱ Expired')}
          </div>
        </div>
        
        <div class="token-details">
          <div class="token-scopes">
            <span class="token-scope-icons">${scopeIcons}</span>
            <span class="token-scope-text">${token.scope.map(s => formatScope(s)).join(', ')}</span>
          </div>
          <div class="token-perms">
            ${permBadges}
          </div>
        </div>

        <div class="token-footer">
          <div class="token-expiry">
            ${statusClass === 'active' ? `Expires ${timeLeft}` : `Ended ${formatDate(token.revokedAt || token.expiry)}`}
          </div>
          ${statusClass === 'active' ? `
            <div class="token-actions">
              <button class="btn btn-ghost btn-xs token-export-btn" title="Export Token">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
              <button class="btn btn-ghost btn-xs token-revoke-btn" title="Revoke Access">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // ── Show Grant Access Modal ──────────────────────────────────────

  async function showGrantModal() {
    const scopes = CapabilityTokenEngine.SCOPE_PRESETS;
    const durations = CapabilityTokenEngine.DURATION_PRESETS;

    modalContainer.innerHTML = `
      <div class="modal-overlay" id="grantModalOverlay">
        <div class="modal grant-modal">
          <div class="modal-header">
            <h3>Grant Access</h3>
            <button class="modal-close" id="closeGrantModal">&times;</button>
          </div>
          
          <div class="modal-body">
            <!-- Agent Info -->
            <div class="form-group">
              <label class="form-label">Agent Name</label>
              <input type="text" class="form-input" id="grantAgentName" placeholder="e.g., Health Coach AI">
            </div>
            
            <div class="form-group">
              <label class="form-label">Agent Public Key</label>
              <input type="text" class="form-input" id="grantAgentKey" placeholder="0x... or paste full key">
              <div class="form-hint">The agent's X25519 encryption public key</div>
            </div>

            <!-- Scope Selection -->
            <div class="form-group">
              <label class="form-label">Data Access</label>
              <div class="scope-grid" id="scopeGrid">
                ${Object.entries(scopes).map(([key, scope]) => `
                  <label class="scope-option">
                    <input type="checkbox" name="scope" value="${key}" data-scopes="${scope.scopes.join(',')}">
                    <div class="scope-card">
                      <span class="scope-icon">${scope.icon}</span>
                      <span class="scope-label">${scope.label}</span>
                      <span class="scope-desc">${scope.description}</span>
                    </div>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- Custom Scope -->
            <div class="form-group">
              <label class="form-label">Custom Scope (optional)</label>
              <input type="text" class="form-input" id="customScope" placeholder="e.g., health/heart-rate, prefs/*">
              <div class="form-hint">Comma-separated paths. Use /* for wildcards.</div>
            </div>

            <!-- Permissions -->
            <div class="form-group">
              <label class="form-label">Permissions</label>
              <div class="perm-options">
                <label class="perm-option">
                  <input type="checkbox" name="permission" value="read" checked>
                  <span class="perm-badge perm-read">Read</span>
                </label>
                <label class="perm-option">
                  <input type="checkbox" name="permission" value="write">
                  <span class="perm-badge perm-write">Write</span>
                </label>
                <label class="perm-option">
                  <input type="checkbox" name="permission" value="append">
                  <span class="perm-badge perm-append">Append</span>
                </label>
              </div>
            </div>

            <!-- Duration -->
            <div class="form-group">
              <label class="form-label">Duration</label>
              <div class="duration-options" id="durationOptions">
                ${Object.entries(durations).map(([key, ms], i) => `
                  <label class="duration-option">
                    <input type="radio" name="duration" value="${key}" ${i === 1 ? 'checked' : ''}>
                    <span class="duration-label">${formatDuration(key)}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-ghost" id="cancelGrantBtn">Cancel</button>
            <button class="btn btn-primary" id="confirmGrantBtn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Grant Access
            </button>
          </div>
        </div>
      </div>
    `;

    // Attach modal events
    document.getElementById('grantModalOverlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'grantModalOverlay') closeModal();
    });
    document.getElementById('closeGrantModal')?.addEventListener('click', closeModal);
    document.getElementById('cancelGrantBtn')?.addEventListener('click', closeModal);
    document.getElementById('confirmGrantBtn')?.addEventListener('click', handleGrant);
  }

  // ── Handle Grant ─────────────────────────────────────────────────

  async function handleGrant() {
    const agentName = document.getElementById('grantAgentName')?.value.trim() || 'Unknown Agent';
    const agentKey = document.getElementById('grantAgentKey')?.value.trim();
    const customScope = document.getElementById('customScope')?.value.trim();

    // Validate agent key
    if (!agentKey || agentKey.length < 32) {
      alert('Please enter a valid agent public key');
      return;
    }

    // Collect scopes
    const selectedScopes = [];
    document.querySelectorAll('input[name="scope"]:checked').forEach(el => {
      const scopes = el.dataset.scopes.split(',');
      selectedScopes.push(...scopes);
    });
    
    if (customScope) {
      selectedScopes.push(...customScope.split(',').map(s => s.trim()).filter(s => s));
    }

    if (selectedScopes.length === 0) {
      alert('Please select at least one data scope');
      return;
    }

    // Collect permissions
    const permissions = [];
    document.querySelectorAll('input[name="permission"]:checked').forEach(el => {
      permissions.push(el.value);
    });

    if (permissions.length === 0) {
      alert('Please select at least one permission');
      return;
    }

    // Get duration
    const duration = document.querySelector('input[name="duration"]:checked')?.value || '24h';

    // Disable button
    const btn = document.getElementById('confirmGrantBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating...';

    try {
      // Normalize agent key (remove 0x prefix if present)
      const normalizedKey = agentKey.startsWith('0x') ? agentKey.slice(2) : agentKey;

      // Create token
      const token = await CapabilityTokenEngine.createToken({
        granteePublicKey: normalizedKey,
        granteeName: agentName,
        scope: [...new Set(selectedScopes)], // dedupe
        permissions,
        duration,
      });

      // Close modal
      closeModal();

      // Show success and export
      const exportData = await CapabilityTokenEngine.exportToken(token.tokenId);
      showExportModal(token, exportData);

      // Refresh token list
      if (currentTab) {
        await renderTokenPanel(currentTab);
      }
    } catch (e) {
      console.error('[TokenUI] Grant failed:', e);
      alert('Failed to create token: ' + e.message);
      btn.disabled = false;
      btn.innerHTML = 'Grant Access';
    }
  }

  // ── Show Export Modal ────────────────────────────────────────────

  function showExportModal(token, exportData) {
    modalContainer.innerHTML = `
      <div class="modal-overlay" id="exportModalOverlay">
        <div class="modal export-modal">
          <div class="modal-header success">
            <div class="success-icon">✓</div>
            <h3>Access Granted!</h3>
          </div>
          
          <div class="modal-body">
            <p class="export-info">
              Share this token with <strong>${escapeHtml(token.granteeName)}</strong> 
              to give them access to your data.
            </p>

            <div class="export-summary">
              <div class="export-item">
                <span class="export-label">Scopes:</span>
                <span class="export-value">${token.scope.map(s => formatScope(s)).join(', ')}</span>
              </div>
              <div class="export-item">
                <span class="export-label">Permissions:</span>
                <span class="export-value">${token.permissions.join(', ')}</span>
              </div>
              <div class="export-item">
                <span class="export-label">Expires:</span>
                <span class="export-value">${formatDate(token.expiry)}</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Token (click to copy)</label>
              <div class="export-token" id="exportTokenData" title="Click to copy">
                ${exportData.slice(0, 50)}...
              </div>
              <div class="form-hint" id="copyHint">Click to copy full token</div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-ghost" id="closeExportBtn">Done</button>
            <button class="btn btn-primary" id="copyTokenBtn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy Token
            </button>
          </div>
        </div>
      </div>
    `;

    const copyToken = async () => {
      await navigator.clipboard.writeText(exportData);
      document.getElementById('copyHint').textContent = '✓ Copied!';
      document.getElementById('copyHint').classList.add('copied');
    };

    document.getElementById('exportTokenData')?.addEventListener('click', copyToken);
    document.getElementById('copyTokenBtn')?.addEventListener('click', copyToken);
    document.getElementById('closeExportBtn')?.addEventListener('click', closeModal);
    document.getElementById('exportModalOverlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'exportModalOverlay') closeModal();
    });
  }

  // ── Show Revoke Modal ────────────────────────────────────────────

  async function showRevokeModal(tokenId) {
    const token = await CapabilityTokenEngine.getToken(tokenId);
    if (!token) return;

    modalContainer.innerHTML = `
      <div class="modal-overlay" id="revokeModalOverlay">
        <div class="modal revoke-modal">
          <div class="modal-header danger">
            <div class="danger-icon">⚠️</div>
            <h3>Revoke Access?</h3>
          </div>
          
          <div class="modal-body">
            <p>
              Are you sure you want to revoke access for 
              <strong>${escapeHtml(token.granteeName)}</strong>?
            </p>
            
            <div class="revoke-details">
              <div class="revoke-item">
                <span>Scopes:</span>
                <span>${token.scope.map(s => formatScope(s)).join(', ')}</span>
              </div>
              <div class="revoke-item">
                <span>Granted:</span>
                <span>${formatDate(token.createdAt)}</span>
              </div>
            </div>

            <label class="checkbox-option">
              <input type="checkbox" id="regenerateDEKs">
              <span>Regenerate encryption keys (invalidates ALL tokens)</span>
            </label>
            <div class="form-hint warning">
              ⚠️ Only check this if you believe the data was compromised
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-ghost" id="cancelRevokeBtn">Cancel</button>
            <button class="btn btn-danger" id="confirmRevokeBtn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              Revoke Access
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('revokeModalOverlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'revokeModalOverlay') closeModal();
    });
    document.getElementById('cancelRevokeBtn')?.addEventListener('click', closeModal);
    document.getElementById('confirmRevokeBtn')?.addEventListener('click', async () => {
      const regenerate = document.getElementById('regenerateDEKs')?.checked;
      const btn = document.getElementById('confirmRevokeBtn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Revoking...';

      try {
        await CapabilityTokenEngine.revokeToken(tokenId, regenerate);
        closeModal();
        
        if (currentTab) {
          await renderTokenPanel(currentTab);
        }
      } catch (e) {
        alert('Failed to revoke: ' + e.message);
        btn.disabled = false;
        btn.innerHTML = 'Revoke Access';
      }
    });
  }

  // ── Export Token ─────────────────────────────────────────────────

  async function exportToken(tokenId) {
    try {
      const token = await CapabilityTokenEngine.getToken(tokenId);
      const exportData = await CapabilityTokenEngine.exportToken(tokenId);
      showExportModal(token, exportData);
    } catch (e) {
      alert('Failed to export token: ' + e.message);
    }
  }

  // ── Show History ─────────────────────────────────────────────────

  async function showHistory(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const tokens = await CapabilityTokenEngine.getAllTokens();
    const historicalTokens = tokens.filter(t => t.isExpired || t.isRevoked);

    const content = container.querySelector('.token-panel');
    if (!content) return;

    // Toggle: if already showing history, go back
    const historyList = content.querySelector('.token-history');
    if (historyList) {
      await renderTokenPanel(containerId);
      return;
    }

    // Add history section
    const historyHtml = `
      <div class="token-history">
        <h4 class="history-title">Access History</h4>
        ${historicalTokens.map(token => renderTokenCard(token)).join('')}
      </div>
    `;

    content.querySelector('#showHistoryBtn').outerHTML = `
      <button class="btn btn-ghost btn-sm btn-block" id="hideHistoryBtn">
        Hide History
      </button>
      ${historyHtml}
    `;

    document.getElementById('hideHistoryBtn')?.addEventListener('click', () => renderTokenPanel(containerId));
  }

  // ── Close Modal ──────────────────────────────────────────────────

  function closeModal() {
    if (modalContainer) {
      modalContainer.innerHTML = '';
    }
  }

  // ── Utility Functions ────────────────────────────────────────────

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function getScopeIcon(scope) {
    const base = scope.split('/')[0];
    const presets = CapabilityTokenEngine.SCOPE_PRESETS;
    return presets[base]?.icon || '📁';
  }

  function formatScope(scope) {
    const base = scope.split('/')[0];
    const presets = CapabilityTokenEngine.SCOPE_PRESETS;
    if (scope.endsWith('/*')) {
      return presets[base]?.label || base + ' (all)';
    }
    return scope;
  }

  function formatDuration(key) {
    const map = { '1h': '1 hour', '24h': '24 hours', '7d': '7 days', '30d': '30 days', '90d': '90 days', '1y': '1 year' };
    return map[key] || key;
  }

  function getTimeLeft(expiry) {
    const diff = expiry - Date.now();
    if (diff <= 0) return 'now';
    if (diff < 60 * 60 * 1000) return `in ${Math.ceil(diff / 60000)}m`;
    if (diff < 24 * 60 * 60 * 1000) return `in ${Math.ceil(diff / 3600000)}h`;
    return `in ${Math.ceil(diff / 86400000)}d`;
  }

  function formatDate(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString(undefined, { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  }

  // ── Public API ───────────────────────────────────────────────────

  return {
    init,
    renderTokenPanel,
    showGrantModal,
    showRevokeModal,
    exportToken,
    closeModal,
  };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TokenUI;
}
