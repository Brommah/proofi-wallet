/**
 * Proofi Chrome Extension — Popup Logic
 *
 * Manages connect, dashboard, credentials, ecosystem, settings.
 */

const WALLET_URL = 'https://proofi-virid.vercel.app/app';
const API_URL    = 'https://proofi-api-production.up.railway.app';
const BASE_URL   = 'https://proofi-virid.vercel.app';

// ── State ──────────────────────────────────────────────────────────

let state = {
  walletAddress: null,
  email: null,
  balance: null,
  credentials: [],
  lastActivity: null,
  theme: 'dark',
  notifications: true,
  connectedAt: null,
};

// ── Ecosystem Apps (all 11) ────────────────────────────────────────

const ECOSYSTEM_APPS = [
  { name: 'Neural Reflex',  emoji: '⚡', category: 'Gaming',     url: `${BASE_URL}/game` },
  { name: 'CryptoQuest',    emoji: '⚔️',  category: 'Gaming',     url: `${BASE_URL}/cryptoquest` },
  { name: 'TrustRate',      emoji: '⭐', category: 'Social',     url: `${BASE_URL}/trustrate` },
  { name: 'DropVault',      emoji: '🔐', category: 'Security',   url: `${BASE_URL}/dropvault` },
  { name: 'SkillBadge',     emoji: '🎓', category: 'Education',  url: `${BASE_URL}/skillbadge` },
  { name: 'ChainPoll',      emoji: '📊', category: 'Governance', url: `${BASE_URL}/chainpoll` },
  { name: 'MemoryChain',    emoji: '📔', category: 'Lifestyle',  url: `${BASE_URL}/memorychain` },
  { name: 'TokenGate',      emoji: '🚪', category: 'Tools',      url: `${BASE_URL}/tokengate` },
  { name: 'NFTicket',       emoji: '🎫', category: 'Events',     url: `${BASE_URL}/nfticket` },
  { name: 'ChainChat',      emoji: '💬', category: 'Social',     url: `${BASE_URL}/chainchat` },
  { name: 'ArtMint',        emoji: '🎨', category: 'Creative',   url: `${BASE_URL}/artmint` },
];

// ── Init ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  // Load state from background
  try {
    const bgState = await sendMessage({ type: 'GET_STATE' });
    if (bgState) {
      state = { ...state, ...bgState };
    }
  } catch (e) {
    console.error('Failed to get state:', e);
  }

  // Apply theme
  applyTheme(state.theme || 'dark');

  // Initialize Token UI
  if (typeof TokenUI !== 'undefined') {
    await TokenUI.init();
  }

  // Render appropriate screen
  if (state.walletAddress) {
    showDashboard();
  } else {
    showConnect();
  }

  // Set up event listeners
  setupListeners();

  // Listen for storage changes (wallet connects in another tab)
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.walletAddress && changes.walletAddress.newValue) {
      state.walletAddress = changes.walletAddress.newValue;
      state.email = changes.email?.newValue || state.email;
      state.connectedAt = changes.connectedAt?.newValue || state.connectedAt;
      showDashboard();
      refreshData();
    }
    if (changes.walletAddress && !changes.walletAddress.newValue) {
      state.walletAddress = null;
      showConnect();
    }
  });
});

// ── Message helper ─────────────────────────────────────────────────

function sendMessage(msg) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

// ── Screen management ──────────────────────────────────────────────

function showConnect() {
  document.getElementById('connectScreen').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('statusDot').className = 'status-dot';
  document.getElementById('statusText').textContent = 'Disconnected';
}

function showDashboard() {
  document.getElementById('connectScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('statusDot').className = 'status-dot connected';
  document.getElementById('statusText').textContent = 'Connected';

  renderDashboard();
  renderEcosystem();
  renderSettings();
  refreshData();
}

// ── Dashboard rendering ────────────────────────────────────────────

function renderDashboard() {
  // Wallet address
  const addr = state.walletAddress || '—';
  const walletEl = document.getElementById('walletAddress');
  walletEl.textContent = truncateAddress(addr);
  walletEl.title = addr;

  // Balance
  renderBalance();

  // Credential count
  const count = (state.credentials || []).length;
  document.getElementById('credentialCount').textContent = count;

  // Last activity
  renderLastActivity();

  // Credentials list
  renderCredentials();
}

function renderBalance() {
  const el = document.getElementById('balanceValue');
  if (state.balance && state.balance.formatted) {
    const match = state.balance.formatted.match(/([\d.]+)/);
    const val = match ? match[1] : '0';
    animateValue(el, val);
  } else {
    el.textContent = '—';
  }
}

function animateValue(el, targetText) {
  el.style.animation = 'none';
  el.offsetHeight; // trigger reflow
  el.textContent = targetText;
  el.style.animation = 'countUp 0.4s ease both';
}

function renderLastActivity() {
  const el = document.getElementById('lastActivity');
  if (state.lastActivity) {
    const d = new Date(state.lastActivity);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) el.textContent = 'Now';
    else if (diffMin < 60) el.textContent = `${diffMin}m`;
    else if (diffMin < 1440) el.textContent = `${Math.floor(diffMin / 60)}h`;
    else el.textContent = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } else {
    el.textContent = '—';
  }
}

function renderCredentials() {
  const container = document.getElementById('credentialsList');
  const items = state.credentials || [];

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📜</div>
        <div class="empty-state-text">
          No credentials yet.<br>
          Play Neural Reflex or use a dApp to earn some!
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map((item, i) => {
    const icon = getCredentialIcon(item);
    const type = item.credentialType || item.type || 'Unknown';
    const cid = item.cid || '—';
    const displayType = formatCredentialType(type);

    return `
      <div class="credential-item" data-cid="${cid}" style="animation-delay: ${i * 0.05}s">
        <div class="credential-icon">${icon}</div>
        <div class="credential-info">
          <div class="credential-type">${displayType}</div>
          <div class="credential-cid">${cid}</div>
        </div>
        <div class="credential-badge">DDC ✓</div>
      </div>
    `;
  }).join('');

  // Click to open on API
  container.querySelectorAll('.credential-item').forEach(el => {
    el.addEventListener('click', () => {
      const cid = el.dataset.cid;
      if (cid && cid !== '—') {
        chrome.tabs.create({ url: `${API_URL}/ddc/read/${cid}` });
      }
    });
  });
}

function getCredentialIcon(item) {
  const type = (item.credentialType || item.type || '').toLowerCase();
  if (type.includes('game') || type.includes('achievement')) return '🎮';
  if (type.includes('memo')) return '📝';
  if (type.includes('identity')) return '🆔';
  if (type.includes('email')) return '📧';
  if (type.includes('score')) return '🏆';
  if (type === 'credential') return '🎓';
  return '📄';
}

function formatCredentialType(type) {
  if (!type) return 'Credential';
  return type.replace(/([A-Z])/g, ' $1').trim();
}

// ── Ecosystem rendering ────────────────────────────────────────────

function renderEcosystem() {
  const grid = document.getElementById('ecosystemGrid');
  grid.innerHTML = ECOSYSTEM_APPS.map((app, i) => `
    <div class="app-card" data-url="${app.url}" style="animation: fadeInUp 0.3s ease ${i * 0.04}s both">
      <span class="app-emoji">${app.emoji}</span>
      <div class="app-name">${app.name}</div>
      <div class="app-category">${app.category}</div>
    </div>
  `).join('');

  grid.querySelectorAll('.app-card').forEach(card => {
    card.addEventListener('click', () => {
      chrome.tabs.create({ url: card.dataset.url });
    });
  });
}

// ── Settings rendering ─────────────────────────────────────────────

function renderSettings() {
  const emailEl = document.getElementById('settingsEmail');
  emailEl.textContent = state.email || truncateAddress(state.walletAddress) || '—';

  const connectedEl = document.getElementById('settingsConnectedAt');
  connectedEl.textContent = state.connectedAt
    ? new Date(state.connectedAt).toLocaleString()
    : '—';

  document.getElementById('themeToggle').checked = (state.theme || 'dark') === 'dark';
  document.getElementById('notifToggle').checked = state.notifications !== false;
}

// ── Data refresh ───────────────────────────────────────────────────

async function refreshData() {
  if (!state.walletAddress) return;

  // Show skeleton loading for credentials
  const credContainer = document.getElementById('credentialsList');
  if (!state.credentials || state.credentials.length === 0) {
    credContainer.innerHTML = `
      <div class="skeleton skeleton-item"></div>
      <div class="skeleton skeleton-item"></div>
      <div class="skeleton skeleton-item"></div>
    `;
  }

  // Fetch balance
  try {
    const balanceData = await sendMessage({ type: 'FETCH_BALANCE' });
    if (balanceData && !balanceData.error) {
      state.balance = balanceData;
      renderBalance();
    }
  } catch (e) {
    console.error('Balance fetch error:', e);
  }

  // Fetch credentials
  try {
    const credData = await sendMessage({ type: 'FETCH_CREDENTIALS' });
    if (credData && credData.credentials) {
      state.credentials = credData.credentials;
      state.lastActivity = credData.lastActivity || state.lastActivity;
      document.getElementById('credentialCount').textContent = state.credentials.length;
      renderCredentials();
      renderLastActivity();
    }
  } catch (e) {
    console.error('Credentials fetch error:', e);
    // If fetch failed, clear skeleton
    if (!state.credentials || state.credentials.length === 0) {
      renderCredentials();
    }
  }
}

// ── Event Listeners ────────────────────────────────────────────────

function setupListeners() {
  // Connect button
  document.getElementById('connectBtn').addEventListener('click', async () => {
    const btn = document.getElementById('connectBtn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block"></span> Opening wallet...`;
    btn.disabled = true;
    btn.style.opacity = '0.7';

    try {
      await sendMessage({ type: 'CONNECT_WALLET' });

      btn.innerHTML = `<span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block"></span> Waiting for auth...`;

      // Poll for connection
      const pollInterval = setInterval(async () => {
        try {
          const newState = await sendMessage({ type: 'GET_STATE' });
          if (newState && newState.walletAddress) {
            clearInterval(pollInterval);
            state = { ...state, ...newState };
            showDashboard();
          }
        } catch (e) { /* ignore */ }
      }, 1500);

      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        btn.innerHTML = originalHTML;
        btn.disabled = false;
        btn.style.opacity = '1';
      }, 300000);
    } catch (e) {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  });

  // Copy address
  document.getElementById('copyBtn').addEventListener('click', async () => {
    const btn = document.getElementById('copyBtn');
    if (state.walletAddress) {
      await navigator.clipboard.writeText(state.walletAddress);
      btn.textContent = '✓';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = '📋';
        btn.classList.remove('copied');
      }, 1500);
    }
  });

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const tab = btn.dataset.tab;

      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(`panel-${tab}`).classList.add('active');

      // Render token panel when switching to tokens tab
      if (tab === 'tokens' && typeof TokenUI !== 'undefined') {
        await TokenUI.renderTokenPanel('tokenPanelContent');
      }
    });
  });

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('change', (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    state.theme = theme;
    applyTheme(theme);
    sendMessage({ type: 'SET_THEME', theme });
  });

  // Notifications toggle
  document.getElementById('notifToggle').addEventListener('change', (e) => {
    state.notifications = e.target.checked;
    sendMessage({ type: 'SET_NOTIFICATIONS', enabled: e.target.checked });
  });

  // Disconnect
  document.getElementById('disconnectBtn').addEventListener('click', async () => {
    if (confirm('Disconnect your wallet from Proofi?')) {
      await sendMessage({ type: 'DISCONNECT_WALLET' });
      state = {
        walletAddress: null, email: null, balance: null,
        credentials: [], lastActivity: null,
        theme: state.theme, notifications: true,
        connectedAt: null,
      };
      showConnect();
    }
  });

  // Open wallet
  document.getElementById('openWalletBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: WALLET_URL });
  });

  // Open explorer
  document.getElementById('openExplorerBtn').addEventListener('click', () => {
    if (state.walletAddress) {
      chrome.tabs.create({ url: `https://explorer.cere.network/account/${state.walletAddress}` });
    } else {
      chrome.tabs.create({ url: 'https://explorer.cere.network' });
    }
  });

  // Footer link
  document.getElementById('footerLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: BASE_URL });
  });
}

// ── Theme ──────────────────────────────────────────────────────────

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

// ── Helpers ────────────────────────────────────────────────────────

function truncateAddress(addr) {
  if (!addr || addr.length < 16) return addr || '—';
  return addr.slice(0, 8) + '···' + addr.slice(-6);
}
