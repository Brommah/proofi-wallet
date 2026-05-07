/**
 * Proofi Wallet — Chrome Extension Popup
 * Handles auth flow, wallet management, DDC storage, and health data.
 */

import { deriveSeedFromPin, encryptSeed, decryptSeed } from './lib/crypto.js';
import { createKeypair, createAuthHeaders, initCrypto, normalizeWalletSecret } from './lib/keyring.js';
import { hexToU8a, u8aToHex } from '@polkadot/util';
import { sendOtp, verifyOtp, registerAddress, storeMemo, storeCredential, listItems } from './lib/api.js';
import { getWalletState, saveWalletState, clearWalletState } from './lib/storage.js';
import { 
  parseAppleHealthXML, 
  generateSampleHealthData, 
  getHealthDataSummary,
  HEALTH_DATA_TYPES 
} from './health-data.js';
import {
  generateDEK,
  encryptAES,
  generateCID,
  uint8ToBase64,
  base64ToUint8,
  generateCapabilityToken
} from './lib/health-crypto.js';
import {
  claimVault,
  getVaultIdentity,
  isNotFound,
  loadVaultSnapshot,
  publishVaultEvent
} from './lib/vault.js';
import {
  CERE_TOKEN_SYMBOL,
  formatTokenAmount,
  getCereBalance,
  parseTokenAmount,
  sendCereTokens
} from './lib/tokens.js';

// ── State ──────────────────────────────────────────────────────────────────

let state = {
  screen: 'loading',
  // Auth
  email: null,
  token: null,
  derivationSalt: null,
  hasExistingWallet: false,
  existingAddress: null,
  // Wallet
  address: null,
  keypair: null, // In-memory only, never persisted
  seedHex: null, // In-memory wallet secret, used to derive the CEF devnet vault identity
  encryptedSeed: null,
  isUnlocked: false,
  // Data
  storedItems: [],
  // Health Data
  healthData: null,
  healthDataSummary: null,
  healthDEK: null,           // Data Encryption Key for health data
  healthDataCID: null,       // CID of encrypted health data on DDC
  healthDataBucket: null,    // DDC bucket ID
  healthDataSynced: false,
  // Agents
  connectedAgents: [],
  pendingAgentRequest: null,
  // Wallet-bound cubby
  cubbyId: null,
  cubbyScopes: [],
  cubbyActivity: [],
  vaultIdentity: null,
  vaultRecord: null,
  vaultScopes: [],
  vaultAgents: [],
  vaultEvents: [],
  vaultStatus: 'locked',
  vaultError: null,
  cereBalance: null,
  cereBalanceStatus: 'idle',
  cereBalanceError: null,
  pendingSignRequest: null,
  isVerifyingOtp: false,
};

const CUBBY_ACTIVITY_KEY = 'proofi_cubby_activity';
const CUBBY_SCOPE_PREFIX = 'cubby:';

function getCubbyId(address = state.address) {
  if (state.vaultRecord?.vaultId) return `proofi-cubby:${state.vaultRecord.vaultId}`;
  if (!address) return null;
  return `proofi-cubby:${address}`;
}

function shortId(value, head = 14, tail = 8) {
  if (!value) return '';
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

function normalizeScope(scope) {
  return String(scope || '').replace(/^cubby:/, '').replace(/^health\//, '');
}

function getKnownCubbyScopes() {
  const scopes = new Set();
  for (const scope of state.vaultScopes || []) {
    const name = scope.name || scope.scope;
    if (name) scopes.add(name);
  }
  if (state.storedItems.length) scopes.add('credentials');
  if (state.healthDataSummary) scopes.add('health');
  if (state.healthDataSynced) scopes.add('health/ddc');
  for (const agent of state.connectedAgents) {
    for (const scope of agent.scopes || []) scopes.add(normalizeScope(scope));
  }
  return Array.from(scopes).map((name) => ({
    id: `${CUBBY_SCOPE_PREFIX}${name}`,
    name,
    cubbyId: state.cubbyId,
  }));
}

async function loadCubbyState() {
  state.cubbyId = getCubbyId();
  const result = await chrome.storage.local.get({ [CUBBY_ACTIVITY_KEY]: [] });
  const localEvents = (result[CUBBY_ACTIVITY_KEY] || []).filter((event) => event.cubbyId === state.cubbyId);
  const vaultEvents = (state.vaultEvents || []).map(vaultEventToActivity);
  state.cubbyActivity = [...vaultEvents, ...localEvents]
    .filter(Boolean)
    .sort((a, b) => b.at - a.at)
    .slice(0, 80);
  state.cubbyScopes = getKnownCubbyScopes();
  renderCubbySummary();
}

async function recordCubbyEvent(kind, detail = {}) {
  if (!state.address) return;
  const cubbyId = getCubbyId();
  const event = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    cubbyId,
    address: state.address,
    at: Date.now(),
    ...detail,
  };
  const result = await chrome.storage.local.get({ [CUBBY_ACTIVITY_KEY]: [] });
  const next = [event, ...(result[CUBBY_ACTIVITY_KEY] || [])].slice(0, 80);
  await chrome.storage.local.set({ [CUBBY_ACTIVITY_KEY]: next });
  state.cubbyActivity = next.filter((entry) => entry.cubbyId === cubbyId);
  state.cubbyScopes = getKnownCubbyScopes();
  renderCubbySummary();
}

function vaultEventToActivity(event) {
  const at = new Date(event.timestamp || event.at || Date.now()).getTime();
  return {
    id: event.id || `${event.scope}:${event.context}:${at}`,
    kind: event.type || event.kind || 'vault-event',
    cubbyId: getCubbyId(),
    at: Number.isFinite(at) ? at : Date.now(),
    scope: event.scope,
    agentName: event.agentName || event.payload?.agentName,
    cid: event.payload?.cid,
  };
}

async function refreshVaultState({ silent = false } = {}) {
  if (!state.seedHex) {
    state.vaultStatus = state.encryptedSeed ? 'locked' : 'missing';
    renderCubbySummary();
    return;
  }

  state.vaultStatus = 'loading';
  state.vaultError = null;
  renderCubbySummary();

  try {
    state.vaultIdentity = await getVaultIdentity(state.seedHex);
    await chrome.storage.local.set({ proofi_vault_identity: state.vaultIdentity });
    const snapshot = await loadVaultSnapshot(state.seedHex);
    state.vaultRecord = snapshot.record;
    state.vaultScopes = snapshot.scopes || [];
    state.vaultAgents = snapshot.agents || [];
    state.vaultEvents = snapshot.events || [];
    state.vaultStatus = 'live';
    state.vaultError = null;
    await chrome.storage.local.set({
      proofi_vault_record: state.vaultRecord,
      proofi_vault_identity: state.vaultIdentity,
    });
    await loadCubbyState();
  } catch (err) {
    if (isNotFound(err)) {
      state.vaultStatus = 'not-found';
    } else {
      state.vaultStatus = 'error';
      state.vaultError = err;
      if (!silent) console.warn('[Proofi] Vault refresh failed:', err);
    }
    renderCubbySummary();
  }
}

async function publishToVault(scope, event) {
  if (!state.seedHex || state.vaultStatus !== 'live') return null;
  try {
    const result = await publishVaultEvent(state.seedHex, scope, event);
    await refreshVaultState({ silent: true });
    return result;
  } catch (err) {
    console.warn('[Proofi] Vault publish failed:', err.message);
    return null;
  }
}

// ── DOM Helpers ────────────────────────────────────────────────────────────

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function showScreen(name) {
  $$('.screen').forEach(s => s.style.display = 'none');
  const screen = $(`#screen-${name}`);
  if (screen) {
    screen.style.display = 'flex';
    screen.classList.add('fade-in');
  }
  state.screen = name;
}

function showError(id, message) {
  const el = $(`#error-${id}`);
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
  }
}

function hideError(id) {
  const el = $(`#error-${id}`);
  if (el) el.style.display = 'none';
}

function showSuccess(id, message) {
  const el = $(`#success-${id}`);
  if (el) {
    el.innerHTML = `<span>✓</span> ${message}`;
    el.style.display = 'flex';
  }
}

function hideSuccess(id) {
  const el = $(`#success-${id}`);
  if (el) el.style.display = 'none';
}

function showToast(text) {
  const existing = document.querySelector('.copy-toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = 'copy-toast';
  toast.textContent = text;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

function setLoading(btn, loading, text) {
  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.dataset.loading = 'true';
    btn.textContent = text || 'LOADING...';
    btn.disabled = true;
  } else {
    delete btn.dataset.loading;
    btn.textContent = btn.dataset.originalText || btn.textContent;
    btn.disabled = false;
    updatePinActionState();
  }
}

function isImportWalletMode() {
  const fields = $('#import-wallet-fields');
  return !!fields && fields.style.display !== 'none';
}

function getPinActionLabel() {
  return isImportWalletMode()
    ? 'IMPORT CERE WALLET'
    : state.hasExistingWallet
      ? 'RESTORE WALLET'
      : 'CREATE WALLET';
}

function updatePinActionState() {
  const btn = $('#btn-setup-pin');
  const pinInput = $('#input-pin');
  if (!btn || !pinInput || btn.dataset.loading === 'true') return;

  const pinReady = pinInput.value.replace(/\D/g, '').length >= 4;
  const importedSecret = normalizeWalletSecret($('#input-recovery-phrase')?.value || '');
  const isHexImport = /^0x[0-9a-fA-F]{64,128}$/.test(importedSecret);
  const isPhraseImport = importedSecret.split(/\s+/).filter(Boolean).length >= 12;
  const importReady = !isImportWalletMode() || isHexImport || isPhraseImport;

  btn.textContent = getPinActionLabel();
  btn.disabled = !(pinReady && importReady);
}

// ── Initialization ─────────────────────────────────────────────────────────

async function init() {
  try {
    // Initialize crypto WASM
    await initCrypto();
    
    // Check for existing wallet state
    const stored = await getWalletState();
    
    if (stored.connected && stored.address) {
      state.address = stored.address;
      state.email = stored.email;
      state.token = stored.token;
      state.encryptedSeed = stored.encryptedSeed;
      const vaultStored = await chrome.storage.local.get(['proofi_vault_record', 'proofi_vault_identity']);
      state.vaultRecord = vaultStored.proofi_vault_record || null;
      state.vaultIdentity = vaultStored.proofi_vault_identity || null;
      state.vaultStatus = state.vaultRecord ? 'locked' : 'locked';
      state.isUnlocked = false;
      await chrome.storage.local.set({ proofi_unlocked: false });
      
      // Update badge
      updateBadge(true);
      
      // Show dashboard
      renderDashboard();
      showScreen('dashboard');
      
      // Load stored data immediately (no PIN needed for viewing)
      await Promise.all([loadItems(), loadHealthDataFromStorage(), loadAgents(), refreshCereBalance()]);
      await loadCubbyState();
    } else {
      showScreen('login');
    }
  } catch (err) {
    console.error('[Proofi] Init error:', err);
    showScreen('login');
  }
}

// ── Auth Flow ──────────────────────────────────────────────────────────────

function setupAuthHandlers() {
  const emailInput = $('#input-email');
  const btnSendOtp = $('#btn-send-otp');
  const btnResendOtp = $('#btn-resend-otp');
  const btnBackEmail = $('#btn-back-email');
  const pinInput = $('#input-pin');
  const btnSetupPin = $('#btn-setup-pin');
  const btnToggleImport = $('#btn-toggle-import');
  const importFields = $('#import-wallet-fields');
  const recoveryInput = $('#input-recovery-phrase');
  
  // Email validation
  emailInput.addEventListener('input', () => {
    const valid = emailInput.value.includes('@') && emailInput.value.includes('.');
    btnSendOtp.disabled = !valid;
    hideError('email');
  });
  
  emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !btnSendOtp.disabled) {
      btnSendOtp.click();
    }
  });
  
  // Send OTP
  btnSendOtp.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    if (!email) return;
    
    setLoading(btnSendOtp, true, 'SENDING...');
    hideError('email');
    
    try {
      await sendOtp(email);
      state.email = email;
      clearOtpInputs();
      
      // Show OTP step
      $('#step-email').style.display = 'none';
      $('#step-otp').style.display = 'flex';
      $('#step-otp').classList.add('fade-in');
      $('#otp-email').textContent = email;
      
      // Focus first OTP digit
      const firstDigit = document.querySelector('.otp-digit');
      if (firstDigit) firstDigit.focus();
    } catch (err) {
      showError('email', err.message);
    } finally {
      setLoading(btnSendOtp, false);
    }
  });

  btnResendOtp.addEventListener('click', async () => {
    if (!state.email) return;

    setLoading(btnResendOtp, true, 'SENDING...');
    hideError('otp');

    try {
      await sendOtp(state.email);
      clearOtpInputs();
      showError('otp', 'New code sent. Use the newest email only; older codes are invalid.');
      document.querySelector('.otp-digit')?.focus();
    } catch (err) {
      showError('otp', normalizeOtpError(err));
    } finally {
      setLoading(btnResendOtp, false);
    }
  });
  
  // Back to email
  btnBackEmail.addEventListener('click', () => {
    $('#step-otp').style.display = 'none';
    $('#step-email').style.display = 'flex';
    hideError('otp');
    clearOtpInputs();
  });
  
  // OTP digit inputs
  setupOtpInputs();
  
  // PIN input
  pinInput.addEventListener('input', () => {
    const pin = pinInput.value.replace(/\D/g, '');
    pinInput.value = pin;
    
    // Update dots
    $$('#pin-dots .pin-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i < pin.length);
    });
    
    updatePinActionState();
    hideError('pin');
  });
  
  pinInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !btnSetupPin.disabled) {
      btnSetupPin.click();
    }
  });

  btnToggleImport.addEventListener('click', () => {
    const isOpen = importFields.style.display !== 'none';
    importFields.style.display = isOpen ? 'none' : 'flex';
    btnToggleImport.textContent = isOpen ? 'IMPORT CERE WALLET' : 'USE PIN-DERIVED WALLET';
    if (!isOpen) recoveryInput.focus();
    updatePinActionState();
    hideError('pin');
  });

  recoveryInput.addEventListener('input', () => {
    updatePinActionState();
    hideError('pin');
  });
  
  // Setup PIN
  btnSetupPin.addEventListener('click', handleSetupPin);
}

function clearOtpInputs() {
  $$('.otp-digit').forEach(d => { d.value = ''; d.classList.remove('filled'); });
}

function normalizeOtpError(err) {
  const message = err?.message || String(err || '');
  if (/outdated|expired|invalid|code/i.test(message)) {
    return new Error('That code is expired or was replaced. Click SEND NEW CODE and use the newest email.');
  }
  return err instanceof Error ? err : new Error(message);
}

function setupOtpInputs() {
  const digits = $$('.otp-digit');
  
  digits.forEach((digit, index) => {
    digit.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val.slice(0, 1);
      e.target.classList.toggle('filled', val.length > 0);
      
      // Auto-advance
      if (val && index < digits.length - 1) {
        digits[index + 1].focus();
      }
      
      // Check if all filled
      const code = Array.from(digits).map(d => d.value).join('');
      if (code.length === 6) {
        handleVerifyOtp(code);
      }
    });
    
    digit.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        digits[index - 1].focus();
        digits[index - 1].value = '';
        digits[index - 1].classList.remove('filled');
      }
    });
    
    digit.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
      pasted.split('').forEach((char, i) => {
        if (digits[i]) {
          digits[i].value = char;
          digits[i].classList.add('filled');
        }
      });
      if (pasted.length === 6) {
        handleVerifyOtp(pasted);
      } else if (digits[pasted.length]) {
        digits[pasted.length].focus();
      }
    });
  });
}

async function handleVerifyOtp(code) {
  if (state.isVerifyingOtp) return;
  state.isVerifyingOtp = true;
  hideError('otp');
  $('#loading-otp').style.display = 'flex';
  
  try {
    const result = await verifyOtp(state.email, code);
    
    state.token = result.token;
    state.derivationSalt = result.derivationSalt;
    state.hasExistingWallet = !!result.hasAddress;
    state.existingAddress = result.address || null;
    
    // Show PIN step
    $('#step-otp').style.display = 'none';
    $('#step-pin').style.display = 'flex';
    $('#step-pin').classList.add('fade-in');
    
    // Update PIN UI for restore vs create
    if (state.hasExistingWallet) {
      $('#pin-title').textContent = 'Enter Your PIN';
      $('#pin-subtitle').textContent = 'Enter your PIN to restore your wallet, or import your Cere Wallet identity.';
    } else {
      $('#pin-title').textContent = 'Create Your PIN';
      $('#pin-subtitle').textContent = 'This PIN derives your wallet keys. Remember it — it cannot be recovered.';
    }
    updatePinActionState();
    
    $('#input-pin').focus();
  } catch (err) {
    const normalized = normalizeOtpError(err);
    showError('otp', normalized.message);
    clearOtpInputs();
    document.querySelector('.otp-digit')?.focus();
  } finally {
    $('#loading-otp').style.display = 'none';
    state.isVerifyingOtp = false;
  }
}

async function handleSetupPin() {
  const pin = $('#input-pin').value;
  if (pin.length < 4) {
    showError('pin', 'Enter a PIN first. It encrypts the imported wallet on this device.');
    return;
  }
  const importedSecret = normalizeWalletSecret($('#input-recovery-phrase')?.value || '');
  const hasImportedSecret = importedSecret.length > 0;
  if (isImportWalletMode() && !hasImportedSecret) {
    showError('pin', 'Paste your Cere recovery phrase to import that wallet.');
    return;
  }
  
  const btn = $('#btn-setup-pin');
  setLoading(btn, true, hasImportedSecret ? 'IMPORTING WALLET...' : 'DERIVING KEYS...');
  $('#loading-pin').style.display = 'flex';
  hideError('pin');
  
  try {
    // Use an imported Cere Wallet identity when present; otherwise derive a Proofi-local root key from PIN + salt.
    const seed = hasImportedSecret
      ? importedSecret
      : await deriveSeedFromPin(pin, state.derivationSalt);
    
    // Create Cere ed25519 keypair
    const keypair = await createKeypair(seed);
    
    // For generated restore, verify the PIN recreates the existing Proofi wallet.
    // Imported Cere wallets intentionally replace the Proofi-derived local address.
    if (!hasImportedSecret && state.hasExistingWallet && state.existingAddress) {
      if (keypair.address !== state.existingAddress) {
        showError('pin', 'Wrong PIN. The PIN you entered doesn\'t match your wallet.');
        setLoading(btn, false);
        $('#loading-pin').style.display = 'none';
        return;
      }
    }
    
    // Encrypt seed for storage
    const encryptedSeed = await encryptSeed(seed, pin);
    
    // Register address with server
    await registerAddress(keypair.address, state.token);
    
    // Save to chrome.storage
    await saveWalletState({
      encryptedSeed,
      address: keypair.address,
      email: state.email,
      token: state.token,
    });
    
    // Update state
    state.address = keypair.address;
    state.keypair = keypair;
    state.seedHex = seed;
    state.encryptedSeed = encryptedSeed;
    state.isUnlocked = true;
    await chrome.storage.local.set({ proofi_unlocked: true });
    
    // Update badge
    updateBadge(true);
    
    // Show dashboard
    renderDashboard();
    showScreen('dashboard');
    
    // Load wallet + devnet vault state
    await Promise.all([loadItems(), loadAgents(), loadHealthDataFromStorage(), refreshCereBalance()]);
    await refreshVaultState({ silent: true });
    await loadCubbyState();
    
  } catch (err) {
    console.error('[Proofi] Setup PIN error:', err);
    showError('pin', err.message || 'Failed to create wallet');
  } finally {
    setLoading(btn, false);
    $('#loading-pin').style.display = 'none';
  }
}

// ── Dashboard ──────────────────────────────────────────────────────────────

function renderDashboard() {
  $('#dash-email').textContent = state.email || '';
  $('#dash-address').textContent = state.address || '';
  state.cubbyId = getCubbyId();
  const cubbyEl = $('#dash-cubby');
  if (cubbyEl) cubbyEl.textContent = state.cubbyId || 'connect wallet first';
  
  // Lock status
  if (state.isUnlocked && state.keypair) {
    $('#lock-dot').className = 'status-square ok';
    $('#lock-status').textContent = 'UNLOCKED';
    $('#btn-unlock').style.display = 'none';
  } else {
    $('#lock-dot').className = 'status-square warn';
    $('#lock-status').textContent = 'LOCKED';
    $('#btn-unlock').style.display = 'block';
  }

  renderCubbySummary();
  renderTokenSummary();
}

function renderCubbySummary() {
  state.cubbyScopes = getKnownCubbyScopes();
  const activeGrants =
    (state.vaultAgents?.length || 0) ||
    state.connectedAgents.filter((a) => a.active && a.expiresAt > Date.now()).length;
  const statCubbies = $('#stat-cubbies');
  const statGrants = $('#stat-grants');
  const statEvents = $('#stat-events');
  if (statCubbies) statCubbies.textContent = String(Math.max(state.cubbyScopes.length, state.address ? 1 : 0));
  if (statGrants) statGrants.textContent = String(activeGrants);
  if (statEvents) statEvents.textContent = String(state.cubbyActivity.length);

  const statusDot = $('#vault-status-dot');
  const statusText = $('#vault-status-text');
  const claimBtn = $('#btn-claim-vault');
  if (statusDot && statusText && claimBtn) {
    statusDot.className = `sync-dot ${state.vaultStatus === 'live' ? 'synced' : 'offline'}`;
    const labels = {
      live: `DEVNET VAULT LIVE ${shortId(state.vaultRecord?.vaultId || '')}`,
      loading: 'LOADING DEVNET VAULT',
      locked: 'UNLOCK TO MAP DEVNET VAULT',
      'not-found': 'NO DEVNET VAULT CLAIMED',
      error: `VAULT ERROR ${state.vaultError?.message || ''}`.trim(),
      missing: 'CONNECT WALLET FIRST',
    };
    statusText.textContent = labels[state.vaultStatus] || 'DEVNET VAULT UNKNOWN';
    claimBtn.style.display = state.vaultStatus === 'not-found' || state.vaultStatus === 'error' ? 'block' : 'none';
    claimBtn.disabled = !state.seedHex || state.vaultStatus === 'loading';
  }

  const list = $('#cubby-activity-list');
  if (!list) return;
  if (!state.cubbyActivity.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="text-display" style="font-size: 2rem; color: var(--steel);">∅</div>
        <p class="text-body-sm text-muted">No cubby activity yet</p>
      </div>
    `;
    return;
  }

  list.innerHTML = state.cubbyActivity.slice(0, 6).map((event) => {
    const at = new Date(event.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const target = event.agentName || event.scope || event.cid || shortId(event.cubbyId);
    return `
      <div class="cubby-activity-item">
        <div>
          <div class="text-mono text-sm">${escapeHtml(event.kind.replace(/-/g, ' '))}</div>
          <div class="text-body-sm text-muted">${escapeHtml(target || '')}</div>
        </div>
        <div class="text-mono text-xs text-muted">${at}</div>
      </div>
    `;
  }).join('');
}

function balanceDisplay(field = 'free', precision = 4) {
  if (!state.cereBalance) return `0 ${CERE_TOKEN_SYMBOL}`;
  const symbol = state.cereBalance.symbol || CERE_TOKEN_SYMBOL;
  return `${formatTokenAmount(state.cereBalance[field] || '0', state.cereBalance.decimals, precision)} ${symbol}`;
}

function renderTokenSummary() {
  const freeEl = $('#token-balance-free');
  const transferableEl = $('#token-balance-transferable');
  const reservedEl = $('#token-balance-reserved');
  const sendBalanceEl = $('#send-balance');
  const statusDot = $('#token-status-dot');
  const statusText = $('#token-status-text');
  const errorEl = $('#token-error');
  const sendBtn = $('#btn-open-send-cere');
  const refreshBtn = $('#btn-refresh-balance');

  if (freeEl) freeEl.textContent = balanceDisplay('free');
  if (transferableEl) transferableEl.textContent = balanceDisplay('transferable');
  if (reservedEl) reservedEl.textContent = balanceDisplay('reserved');
  if (sendBalanceEl) sendBalanceEl.textContent = balanceDisplay('transferable');

  const isLive = state.cereBalanceStatus === 'live';
  const isLoading = state.cereBalanceStatus === 'loading';
  const isError = state.cereBalanceStatus === 'error';
  if (statusDot) statusDot.className = `sync-dot ${isLive ? 'synced' : 'offline'}`;
  if (statusText) {
    statusText.textContent = isLive
      ? 'LIVE'
      : isLoading
        ? 'SYNCING'
        : isError
          ? 'BALANCE ERROR'
          : 'READY';
  }
  if (errorEl) {
    errorEl.style.display = isError ? 'block' : 'none';
    errorEl.textContent = state.cereBalanceError?.message || '';
  }
  if (sendBtn) sendBtn.disabled = !state.address || isLoading;
  if (refreshBtn) refreshBtn.disabled = isLoading;
  updateSendActionState();
}

async function refreshCereBalance({ silent = false } = {}) {
  if (!state.address) return;
  if (!silent) {
    state.cereBalanceStatus = 'loading';
    state.cereBalanceError = null;
    renderTokenSummary();
  }

  try {
    state.cereBalance = await getCereBalance(state.address);
    state.cereBalanceStatus = 'live';
    state.cereBalanceError = null;
  } catch (err) {
    state.cereBalanceStatus = 'error';
    state.cereBalanceError = err;
    console.warn('[Proofi] CERE balance refresh failed:', err.message);
  } finally {
    renderTokenSummary();
  }
}

function updateSendActionState() {
  const btn = $('#btn-submit-send');
  const toInput = $('#input-send-to');
  const amountInput = $('#input-send-amount');
  if (!btn || btn.dataset.loading === 'true') return;

  let amountReady = false;
  try {
    amountReady =
      !!state.cereBalance &&
      parseTokenAmount(amountInput?.value || '', state.cereBalance.decimals) > 0n;
  } catch {
    amountReady = false;
  }

  btn.disabled = !((toInput?.value || '').trim().length >= 12 && amountReady);
}

function setupDashboardHandlers() {
  // Copy address
  $('#btn-copy-address').addEventListener('click', () => {
    if (state.address) {
      navigator.clipboard.writeText(state.address);
      showToast('ADDRESS COPIED');
    }
  });
  
  $('#address-card').addEventListener('click', () => {
    if (state.address) {
      navigator.clipboard.writeText(state.address);
      showToast('ADDRESS COPIED');
    }
  });

  $('#btn-copy-cubby').addEventListener('click', () => {
    const cubbyId = getCubbyId();
    if (cubbyId) {
      navigator.clipboard.writeText(cubbyId);
      showToast('CUBBY COPIED');
    }
  });

  $('#btn-claim-vault').addEventListener('click', claimDevnetVault);
  $('#btn-refresh-balance').addEventListener('click', () => refreshCereBalance());
  $('#btn-open-send-cere').addEventListener('click', async () => {
    hideError('send');
    hideSuccess('send');
    $('#input-send-to').value = '';
    $('#input-send-amount').value = '';
    renderTokenSummary();
    showScreen('send');
    await refreshCereBalance({ silent: true });
    $('#input-send-to').focus();
  });
  
  // Store memo
  $('#btn-store-memo').addEventListener('click', () => {
    hideError('memo');
    hideSuccess('memo');
    $('#input-memo').value = '';
    showScreen('memo');
    
    // Check if we need to auto-fill from context menu
    chrome.storage.local.get('proofi_pending_store', (result) => {
      if (result.proofi_pending_store) {
        $('#input-memo').value = result.proofi_pending_store;
        $('#btn-submit-memo').disabled = false;
        chrome.storage.local.remove('proofi_pending_store');
      }
    });
  });
  
  // Store credential
  $('#btn-store-cred').addEventListener('click', () => {
    hideError('cred');
    hideSuccess('cred');
    $('#input-cred-data').value = '';
    showScreen('credential');
  });
  
  // Refresh
  $('#btn-refresh').addEventListener('click', async () => {
    await loadItems();
    await loadCubbyState();
  });
  $('#btn-refresh-cubby').addEventListener('click', loadCubbyState);
  
  // Unlock
  $('#btn-unlock').addEventListener('click', () => {
    showUnlockUI('dashboard');
  });
  
  // Disconnect
  $('#btn-disconnect').addEventListener('click', handleDisconnect);
}

async function claimDevnetVault() {
  if (!state.seedHex) {
    showUnlockUI('dashboard');
    return;
  }

  const btn = $('#btn-claim-vault');
  setLoading(btn, true, 'CLAIMING...');
  state.vaultStatus = 'loading';
  renderCubbySummary();

  try {
    const record = await claimVault(state.seedHex, 'Proofi Wallet Cubby', (event) => {
      $('#vault-status-text').textContent = event.kind.replace(/-/g, ' ').toUpperCase();
    });
    state.vaultRecord = record;
    state.vaultStatus = 'live';
    await chrome.storage.local.set({ proofi_vault_record: record });
    await recordCubbyEvent('claim-vault', { scope: record.vaultId });
    await refreshVaultState();
    showToast('DEVNET VAULT CLAIMED');
  } catch (err) {
    state.vaultStatus = 'error';
    state.vaultError = err;
    renderCubbySummary();
    showToast('VAULT CLAIM FAILED');
    console.error('[Proofi] Vault claim failed:', err);
  } finally {
    setLoading(btn, false);
  }
}

// ── CERE Transfer ──────────────────────────────────────────────────────────

function setupSendHandlers() {
  const toInput = $('#input-send-to');
  const amountInput = $('#input-send-amount');
  const btnSubmit = $('#btn-submit-send');

  $('#btn-send-back').addEventListener('click', () => {
    showScreen('dashboard');
  });

  [toInput, amountInput].forEach((input) => {
    input.addEventListener('input', () => {
      hideError('send');
      hideSuccess('send');
      updateSendActionState();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !btnSubmit.disabled) btnSubmit.click();
    });
  });

  btnSubmit.addEventListener('click', doSendCere);
}

async function doSendCere() {
  const btn = $('#btn-submit-send');
  const to = $('#input-send-to').value.trim();
  const amount = $('#input-send-amount').value.trim();

  hideError('send');
  hideSuccess('send');

  if (!state.seedHex) {
    showError('send', 'Unlock Proofi first so it can sign the devnet transfer.');
    showUnlockUI('send');
    return;
  }

  setLoading(btn, true, 'SENDING...');
  $('#loading-send').style.display = 'flex';

  try {
    const result = await sendCereTokens({
      walletSecret: state.seedHex,
      to,
      amount,
    });

    await recordCubbyEvent('send-cere-devnet', {
      scope: 'tokens',
      txHash: result.hash,
      amountPlanck: result.amountPlanck,
    });
    await publishToVault('tokens', {
      type: 'proofi.cere.sent',
      context: result.hash,
      target: to,
      payload: {
        txHash: result.hash,
        to,
        amountPlanck: result.amountPlanck,
        feePlanck: result.feePlanck,
        cubbyId: getCubbyId(),
      },
    });

    $('#input-send-amount').value = '';
    showSuccess('send', `Sent ${escapeHtml(amount)} ${escapeHtml(result.symbol)} — tx ${shortId(result.hash, 10, 8)}`);
    await refreshCereBalance();
    await loadCubbyState();
  } catch (err) {
    showError('send', err.message || 'Transfer failed');
  } finally {
    $('#loading-send').style.display = 'none';
    setLoading(btn, false);
    updateSendActionState();
  }
}

// ── Raw Vault Signing ──────────────────────────────────────────────────────

function isValidRawBytesHex(bytesHex) {
  return typeof bytesHex === 'string' && /^0x([0-9a-fA-F]{2})*$/.test(bytesHex);
}

function signError(code, error) {
  return { requestId: state.pendingSignRequest?.requestId, code, error };
}

function setupSignHandlers() {
  $('#btn-sign-back').addEventListener('click', () => {
    showScreen('dashboard');
  });

  $('#btn-reject-sign').addEventListener('click', () => {
    rejectPendingSign('USER_REJECTED', 'User rejected signing');
  });

  $('#btn-approve-sign').addEventListener('click', approvePendingSign);

  const unlock = async () => {
    const pin = $('#sign-pin').value;
    if (pin.length < 4) return;
    hideError('sign');
    try {
      await unlockWallet(pin);
      $('#sign-pin').value = '';
      $('#sign-pin-unlock').style.display = 'none';
      renderSignRequest();
      showToast('WALLET UNLOCKED');
    } catch (err) {
      showError('sign', 'Wrong PIN: ' + err.message);
    }
  };
  $('#btn-sign-unlock').addEventListener('click', unlock);
  $('#sign-pin').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') unlock();
  });
}

async function loadPendingSignRequest() {
  const result = await chrome.storage.local.get('proofi_pending_sign');
  state.pendingSignRequest = result.proofi_pending_sign || null;
  renderSignRequest();
  showScreen('sign');
}

function renderSignRequest() {
  const req = state.pendingSignRequest;
  hideError('sign');
  hideSuccess('sign');

  $('#sign-origin').textContent = req?.origin || 'No pending request';
  $('#sign-purpose').textContent = req?.purpose || 'vault-sdk';
  $('#sign-bytes').textContent = req?.bytesHex ? shortId(req.bytesHex, 80, 40) : '';
  $('#sign-vault').textContent = req?.vaultId || state.vaultRecord?.vaultId || 'No devnet vault claimed';

  const canAttempt = !!req && !!state.vaultRecord?.vaultId && isValidRawBytesHex(req.bytesHex);
  const approveBtn = $('#btn-approve-sign');
  approveBtn.disabled = !canAttempt;
  if (approveBtn.dataset.loading !== 'true') {
    approveBtn.textContent = state.seedHex ? 'SIGN' : 'UNLOCK & SIGN';
  }
  $('#btn-reject-sign').disabled = !req;
  $('#sign-pin-unlock').style.display = canAttempt && !state.seedHex ? 'block' : 'none';

  if (!req) {
    showError('sign', 'No pending Proofi signature request.');
    return;
  }
  if (!isValidRawBytesHex(req.bytesHex)) {
    showError('sign', 'Invalid raw bytes payload.');
    return;
  }
  if (!state.vaultRecord?.vaultId) {
    showError('sign', 'Claim your devnet vault/cubby before signing.');
  }
}

function rejectPendingSign(code, error) {
  const req = state.pendingSignRequest;
  if (!req?.requestId) {
    showScreen('dashboard');
    return;
  }

  chrome.runtime.sendMessage({
    type: 'SIGN_RAW_BYTES_REJECTED',
    requestId: req.requestId,
    code,
    error,
  }, () => {
    state.pendingSignRequest = null;
    chrome.storage.local.remove('proofi_pending_sign');
    showScreen('dashboard');
  });
}

async function approvePendingSign() {
  const req = state.pendingSignRequest;
  if (!req) {
    showError('sign', 'No pending signature request.');
    return;
  }
  if (!isValidRawBytesHex(req.bytesHex)) {
    rejectPendingSign('INVALID_PAYLOAD', 'Invalid raw bytes payload');
    return;
  }
  if (!state.vaultRecord?.vaultId) {
    rejectPendingSign('PROOFI_UNCLAIMED', 'Claim your devnet vault/cubby before signing');
    return;
  }
  if (!state.seedHex || !state.keypair) {
    const pin = $('#sign-pin').value;
    if (pin.length < 4) {
      $('#sign-pin-unlock').style.display = 'block';
      $('#sign-pin').focus();
      showError('sign', 'Enter your PIN, then click UNLOCK & SIGN.');
      return;
    }

    const btn = $('#btn-approve-sign');
    setLoading(btn, true, 'UNLOCKING...');
    try {
      await unlockWallet(pin);
      $('#sign-pin').value = '';
      $('#sign-pin-unlock').style.display = 'none';
      setLoading(btn, false);
      renderSignRequest();
    } catch (err) {
      showError('sign', 'Wrong PIN: ' + err.message);
      setLoading(btn, false);
      renderSignRequest();
      return;
    }
  }
  if (req.address && state.address !== req.address) {
    rejectPendingSign('KEY_MISMATCH', 'Current wallet address does not match the requested signer');
    return;
  }
  const currentPublicKey = (state.keypair.publicKey || '').toLowerCase();
  if (req.publicKeyHex && currentPublicKey !== req.publicKeyHex.toLowerCase()) {
    rejectPendingSign('KEY_MISMATCH', 'Current wallet public key does not match the requested signer');
    return;
  }

  const btn = $('#btn-approve-sign');
  setLoading(btn, true, 'SIGNING...');

  try {
    const bytes = hexToU8a(req.bytesHex);
    const signatureHex = u8aToHex(state.keypair.sign(bytes));
    const response = {
      requestId: req.requestId,
      signatureHex,
      publicKeyHex: state.keypair.publicKey,
      address: state.address,
    };

    chrome.runtime.sendMessage({
      type: 'SIGN_RAW_BYTES_RESULT',
      requestId: req.requestId,
      response,
    }, () => {
      state.pendingSignRequest = null;
      chrome.storage.local.remove('proofi_pending_sign');
      showSuccess('sign', 'Signed raw bytes for vault request.');
      setTimeout(() => window.close(), 700);
    });
  } catch (err) {
    rejectPendingSign('INVALID_PAYLOAD', err.message || 'Failed to sign raw bytes');
  } finally {
    setLoading(btn, false);
  }
}

// ── Store Memo ─────────────────────────────────────────────────────────────

function setupMemoHandlers() {
  const memoInput = $('#input-memo');
  const btnSubmit = $('#btn-submit-memo');
  
  memoInput.addEventListener('input', () => {
    btnSubmit.disabled = !memoInput.value.trim();
    hideError('memo');
    hideSuccess('memo');
  });
  
  btnSubmit.addEventListener('click', async () => {
    if (!memoInput.value.trim()) return;
    
    // Check if we need PIN unlock
    if (!state.keypair) {
      // Show PIN unlock inline
      $('#memo-pin-unlock').style.display = 'block';
      $('#memo-pin').focus();
      
      // Set up one-time handler
      const handleUnlock = async () => {
        const pin = $('#memo-pin').value;
        if (pin.length < 4) return;
        
        try {
          await unlockWallet(pin);
          $('#memo-pin-unlock').style.display = 'none';
          $('#memo-pin').value = '';
          // Now store
          await doStoreMemo();
        } catch (err) {
          showError('memo', 'Wrong PIN: ' + err.message);
        }
      };
      
      $('#btn-memo-unlock').onclick = handleUnlock;
      $('#memo-pin').onkeydown = (e) => { if (e.key === 'Enter') handleUnlock(); };
      return;
    }
    
    await doStoreMemo();
  });
  
  $('#btn-memo-back').addEventListener('click', () => {
    showScreen('dashboard');
    $('#memo-pin-unlock').style.display = 'none';
  });
}

async function doStoreMemo() {
  const memoInput = $('#input-memo');
  const btnSubmit = $('#btn-submit-memo');
  const memo = memoInput.value.trim();
  if (!memo) return;
  
  setLoading(btnSubmit, true, 'STORING...');
  hideError('memo');
  hideSuccess('memo');
  
  try {
    const headers = getAuthHeaders();
    const result = await storeMemo(memo, headers);
    showSuccess('memo', `Stored on DDC — CID: ${(result.cid || '').slice(0, 16)}...`);
    memoInput.value = '';
    btnSubmit.disabled = true;
    await recordCubbyEvent('write-memo', {
      scope: 'credentials',
      cid: result.cid,
    });
    await publishToVault('credentials', {
      type: 'proofi.memo.stored',
      context: 'proofi-extension',
      payload: { cid: result.cid, cubbyId: getCubbyId() },
    });
    
    // Refresh items list
    loadItems();
  } catch (err) {
    showError('memo', err.message);
  } finally {
    setLoading(btnSubmit, false);
  }
}

// ── Store Credential ───────────────────────────────────────────────────────

function setupCredentialHandlers() {
  const credData = $('#input-cred-data');
  const btnSubmit = $('#btn-submit-cred');
  
  credData.addEventListener('input', () => {
    btnSubmit.disabled = !credData.value.trim();
    hideError('cred');
    hideSuccess('cred');
  });
  
  btnSubmit.addEventListener('click', async () => {
    if (!credData.value.trim()) return;
    
    // Check if we need PIN unlock
    if (!state.keypair) {
      $('#cred-pin-unlock').style.display = 'block';
      $('#cred-pin').focus();
      
      const handleUnlock = async () => {
        const pin = $('#cred-pin').value;
        if (pin.length < 4) return;
        
        try {
          await unlockWallet(pin);
          $('#cred-pin-unlock').style.display = 'none';
          $('#cred-pin').value = '';
          await doStoreCredential();
        } catch (err) {
          showError('cred', 'Wrong PIN: ' + err.message);
        }
      };
      
      $('#btn-cred-unlock').onclick = handleUnlock;
      $('#cred-pin').onkeydown = (e) => { if (e.key === 'Enter') handleUnlock(); };
      return;
    }
    
    await doStoreCredential();
  });
  
  $('#btn-cred-back').addEventListener('click', () => {
    showScreen('dashboard');
    $('#cred-pin-unlock').style.display = 'none';
  });
}

async function doStoreCredential() {
  const credData = $('#input-cred-data');
  const credType = $('#input-cred-type').value;
  const btnSubmit = $('#btn-submit-cred');
  const rawData = credData.value.trim();
  if (!rawData) return;
  
  setLoading(btnSubmit, true, 'ISSUING...');
  hideError('cred');
  hideSuccess('cred');
  
  try {
    let claimData;
    try {
      claimData = JSON.parse(rawData);
    } catch {
      claimData = { value: rawData };
    }
    
    const headers = getAuthHeaders();
    const result = await storeCredential(credType, claimData, headers);
    showSuccess('cred', `Credential issued — CID: ${(result.cid || '').slice(0, 16)}...`);
    credData.value = '';
    btnSubmit.disabled = true;
    await recordCubbyEvent('write-credential', {
      scope: 'credentials',
      cid: result.cid,
      credentialType: credType,
    });
    await publishToVault('credentials', {
      type: 'proofi.credential.issued',
      context: 'proofi-extension',
      payload: { cid: result.cid, credentialType: credType, cubbyId: getCubbyId() },
    });
    
    loadItems();
  } catch (err) {
    showError('cred', err.message);
  } finally {
    setLoading(btnSubmit, false);
  }
}

// ── Wallet Unlock ──────────────────────────────────────────────────────────

async function unlockWallet(pin) {
  if (!state.encryptedSeed) {
    throw new Error('No encrypted seed found');
  }
  
  const seed = await decryptSeed(state.encryptedSeed, pin);
  const keypair = await createKeypair(seed);
  
  // Verify address matches
  if (state.address && keypair.address !== state.address) {
    throw new Error('Wrong PIN');
  }
  
  state.keypair = keypair;
  state.seedHex = seed;
  state.isUnlocked = true;
  await chrome.storage.local.set({ proofi_unlocked: true });
  renderDashboard();
  await refreshVaultState({ silent: true });
  await refreshCereBalance({ silent: true });
  await loadCubbyState();
}

function showUnlockUI(returnScreen) {
  // Simple inline unlock on dashboard
  const pin = prompt('Enter your PIN to unlock signing:');
  if (!pin) return;
  
  unlockWallet(pin).then(async () => {
    showToast('WALLET UNLOCKED');
    await Promise.all([loadItems(), loadAgents(), loadHealthDataFromStorage(), refreshCereBalance({ silent: true })]);
    await refreshVaultState({ silent: true });
  }).catch((err) => {
    alert('Unlock failed: ' + err.message);
  });
}

// ── Auth Headers ───────────────────────────────────────────────────────────

function getAuthHeaders() {
  // Prefer signature auth if keypair is available
  if (state.keypair) {
    return createAuthHeaders(state.keypair);
  }
  
  // Fallback to JWT Bearer
  if (state.token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.token}`,
    };
  }
  
  return { 'Content-Type': 'application/json' };
}

// ── Data Loading ───────────────────────────────────────────────────────────

async function loadItems() {
  if (!state.address) return;
  
  try {
    const headers = getAuthHeaders();
    const result = await listItems(headers);
    
    if (result.ok && result.items) {
      state.storedItems = result.items;
      renderItems();
      renderCubbySummary();
    }
  } catch (err) {
    console.warn('[Proofi] Failed to load items:', err.message);
  }
}

function renderItems() {
  const container = $('#items-list');
  
  if (state.storedItems.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="text-display" style="font-size: 2rem; color: var(--steel);">∅</div>
        <p class="text-body-sm text-muted">No data stored yet</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = state.storedItems.map(item => {
    const isAchievement = item.credentialType === 'GameAchievement';
    let badgeClass, badgeLabel, badgeIcon;
    
    if (item.type === 'memo') {
      badgeClass = 'memo';
      badgeLabel = 'MEMO';
      badgeIcon = '📝';
    } else if (isAchievement) {
      // Differentiate by source app
      const game = item.game || item.credentialData?.game || '';
      if (game === 'skillbadge') {
        badgeClass = 'education';
        badgeLabel = 'QUIZ BADGE';
        badgeIcon = '🎓';
      } else if (game === 'snake' || game === 'cryptoquest') {
        badgeClass = 'achievement';
        badgeLabel = 'GAME SCORE';
        badgeIcon = '🎮';
      } else {
        badgeClass = 'achievement';
        badgeLabel = game ? game.toUpperCase() : 'ACHIEVEMENT';
        badgeIcon = '⚡';
      }
    } else if (item.credentialType === 'WalletRecovery') {
      badgeClass = 'recovery';
      badgeLabel = 'RECOVERY';
      badgeIcon = '🔄';
    } else {
      badgeClass = 'credential';
      badgeLabel = (item.credentialType || 'CREDENTIAL').toUpperCase();
      badgeIcon = '🔒';
    }
    
    const time = item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : '';
    
    return `
      <a href="${item.cdnUrl || '#'}" target="_blank" rel="noopener" class="item-card">
        <div class="item-card-header">
          <span class="item-badge ${badgeClass}">${badgeIcon} ${badgeLabel}</span>
          ${time ? `<span class="item-time">${time}</span>` : ''}
        </div>
        <div class="item-cid">${item.cid || ''}</div>
      </a>
    `;
  }).join('');
}

// ── Disconnect ─────────────────────────────────────────────────────────────

async function handleDisconnect() {
  await clearWalletState();
  await chrome.storage.local.remove([
    'proofi_vault_record',
    'proofi_vault_identity',
    'proofi_unlocked',
    'proofi_pending_sign',
    'proofi_sign_result',
  ]);
  
  state = {
    screen: 'login',
    email: null,
    token: null,
    derivationSalt: null,
    hasExistingWallet: false,
    existingAddress: null,
    address: null,
    keypair: null,
    seedHex: null,
    encryptedSeed: null,
    isUnlocked: false,
    storedItems: [],
    healthData: null,
    healthDataSummary: null,
    healthDEK: null,
    healthDataCID: null,
    healthDataBucket: null,
    healthDataSynced: false,
    connectedAgents: [],
    pendingAgentRequest: null,
    cubbyId: null,
    cubbyScopes: [],
    cubbyActivity: [],
    vaultIdentity: null,
    vaultRecord: null,
    vaultScopes: [],
    vaultAgents: [],
    vaultEvents: [],
    vaultStatus: 'locked',
    vaultError: null,
    cereBalance: null,
    cereBalanceStatus: 'idle',
    cereBalanceError: null,
    pendingSignRequest: null,
    isVerifyingOtp: false,
  };
  
  updateBadge(false);
  
  // Reset login form
  $('#input-email').value = '';
  $('#input-pin').value = '';
  $('#input-recovery-phrase').value = '';
  $('#import-wallet-fields').style.display = 'none';
  $('#btn-toggle-import').textContent = 'IMPORT CERE WALLET';
  $$('.otp-digit').forEach(d => { d.value = ''; d.classList.remove('filled'); });
  $$('#pin-dots .pin-dot').forEach(d => d.classList.remove('active'));
  $('#step-email').style.display = 'flex';
  $('#step-otp').style.display = 'none';
  $('#step-pin').style.display = 'none';
  hideError('email');
  hideError('otp');
  hideError('pin');
  
  showScreen('login');
}

// ── Badge ──────────────────────────────────────────────────────────────────

function updateBadge(connected) {
  try {
    chrome.runtime.sendMessage({
      type: 'PROOFI_BADGE_UPDATE',
      connected,
      address: state.address,
    });
  } catch (e) {
    // Background might not be ready
  }
}

// ── Message Handling ───────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PROOFI_STORE_TEXT') {
    // Received text from context menu / content script
    if (state.screen === 'dashboard' || state.address) {
      // Auto-navigate to store memo
      $('#input-memo').value = message.text;
      $('#btn-submit-memo').disabled = false;
      hideError('memo');
      hideSuccess('memo');
      showScreen('memo');
    } else {
      // Store for later
      chrome.storage.local.set({ proofi_pending_store: message.text });
    }
    sendResponse({ ok: true });
  }
  
  if (message.type === 'PROOFI_GET_STATE') {
    sendResponse({
      connected: !!state.address,
      address: state.address,
      isUnlocked: state.isUnlocked,
    });
  }
  
  return true; // Keep message channel open for async
});

// ── Health Data ────────────────────────────────────────────────────────────

function setupHealthHandlers() {
  // Navigate to health screen
  $('#btn-health-data').addEventListener('click', () => {
    loadHealthDataFromStorage();
    showScreen('health');
  });
  
  $('#btn-health-back').addEventListener('click', () => {
    showScreen('dashboard');
  });
  
  // File import
  $('#health-file-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    $('#health-import-progress').style.display = 'flex';
    hideError('health');
    hideSuccess('health');
    
    try {
      const text = await file.text();
      const healthData = parseAppleHealthXML(text);
      await saveHealthData(healthData);
      showSuccess('health', `Imported ${state.healthDataSummary.total} records`);
    } catch (err) {
      showError('health', 'Failed to parse file: ' + err.message);
    } finally {
      $('#health-import-progress').style.display = 'none';
    }
  });
  
  // Load sample data
  $('#btn-load-sample').addEventListener('click', async () => {
    $('#health-import-progress').style.display = 'flex';
    hideError('health');
    hideSuccess('health');
    
    try {
      const sampleData = generateSampleHealthData();
      await saveHealthData(sampleData);
      showSuccess('health', `Loaded ${state.healthDataSummary.total} sample records`);
    } catch (err) {
      showError('health', 'Failed to load sample: ' + err.message);
    } finally {
      $('#health-import-progress').style.display = 'none';
    }
  });
  
  // Sync to DDC
  $('#btn-sync-ddc').addEventListener('click', async () => {
    if (!state.healthData) {
      showError('health', 'No health data to sync');
      return;
    }
    
    // Check if we need PIN unlock
    if (!state.keypair) {
      $('#health-pin-unlock').style.display = 'block';
      $('#health-pin').focus();
      
      const handleUnlock = async () => {
        const pin = $('#health-pin').value;
        if (pin.length < 4) return;
        
        try {
          await unlockWallet(pin);
          $('#health-pin-unlock').style.display = 'none';
          $('#health-pin').value = '';
          await doSyncToDDC();
        } catch (err) {
          showError('health', 'Wrong PIN: ' + err.message);
        }
      };
      
      $('#btn-health-unlock').onclick = handleUnlock;
      $('#health-pin').onkeydown = (e) => { if (e.key === 'Enter') handleUnlock(); };
      return;
    }
    
    await doSyncToDDC();
  });
}

async function saveHealthData(healthData) {
  state.healthData = healthData;
  state.healthDataSummary = getHealthDataSummary(healthData);
  state.healthDataSynced = false;
  
  // Generate a DEK for this health data
  state.healthDEK = generateDEK();
  
  // Save to chrome.storage
  await chrome.storage.local.set({
    proofi_health_data: healthData,
    proofi_health_summary: state.healthDataSummary,
    proofi_health_dek: uint8ToBase64(state.healthDEK)
  });
  
  renderHealthSummary();
}

async function loadHealthDataFromStorage() {
  const result = await chrome.storage.local.get([
    'proofi_health_data',
    'proofi_health_summary',
    'proofi_health_dek',
    'proofi_health_cid',
    'proofi_health_bucket',
    'proofi_health_synced'
  ]);
  
  if (result.proofi_health_data) {
    state.healthData = result.proofi_health_data;
    state.healthDataSummary = result.proofi_health_summary || getHealthDataSummary(result.proofi_health_data);
    state.healthDEK = result.proofi_health_dek ? base64ToUint8(result.proofi_health_dek) : null;
    state.healthDataCID = result.proofi_health_cid || null;
    state.healthDataBucket = result.proofi_health_bucket || null;
    state.healthDataSynced = result.proofi_health_synced || false;
    
    renderHealthSummary();
  }
}

function renderHealthSummary() {
  if (!state.healthDataSummary) {
    $('#health-summary').style.display = 'none';
    $('#health-sync-section').style.display = 'none';
    return;
  }
  
  $('#health-summary').style.display = 'block';
  $('#health-sync-section').style.display = 'block';
  
  const grid = $('#health-stats-grid');
  const summary = state.healthDataSummary;
  
  const stats = [
    { key: 'sleep', icon: '🌙', label: 'SLEEP' },
    { key: 'heart', icon: '❤️', label: 'HEART' },
    { key: 'steps', icon: '👟', label: 'STEPS' },
    { key: 'hrv', icon: '📈', label: 'HRV' }
  ].filter(s => summary[s.key]?.count > 0);
  
  grid.innerHTML = stats.map(s => `
    <div class="health-stat-item">
      <div class="health-stat-value">${summary[s.key].count.toLocaleString()}</div>
      <div class="health-stat-label">${s.icon} ${s.label}</div>
    </div>
  `).join('');
  
  // Update sync status
  const syncStatus = $('#health-sync-status');
  if (state.healthDataSynced && state.healthDataCID) {
    syncStatus.innerHTML = `
      <span class="sync-dot synced"></span>
      <span class="text-mono text-xs">SYNCED TO DDC</span>
    `;
    
    // Show CID
    $('#sync-result').style.display = 'block';
    $('#health-cid').textContent = state.healthDataCID;
    $('#health-bucket').textContent = state.healthDataBucket || '1229';
  } else {
    syncStatus.innerHTML = `
      <span class="sync-dot offline"></span>
      <span class="text-mono text-xs">NOT SYNCED TO DDC</span>
    `;
    $('#sync-result').style.display = 'none';
  }
}

async function doSyncToDDC() {
  if (!state.healthData || !state.healthDEK) {
    showError('health', 'No health data to sync');
    return;
  }
  
  $('#sync-progress').style.display = 'flex';
  hideError('health');
  
  try {
    // Encrypt health data with DEK
    const jsonData = JSON.stringify(state.healthData);
    const encrypted = await encryptAES(jsonData, state.healthDEK);
    
    // Generate CID for the encrypted data
    const cid = await generateCID(encrypted);
    
    // Store via background script (which proxies to API)
    const headers = getAuthHeaders();
    const result = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'HEALTH_DATA_TO_DDC',
        payload: {
          encryptedData: encrypted,
          cid: cid
        }
      }, (response) => {
        if (response?.error) reject(new Error(response.error));
        else resolve(response);
      });
    });
    
    // Save CID reference
    state.healthDataCID = result.cid || cid;
    state.healthDataBucket = result.bucket || '1229';
    state.healthDataSynced = true;
    
    await chrome.storage.local.set({
      proofi_health_cid: state.healthDataCID,
      proofi_health_bucket: state.healthDataBucket,
      proofi_health_synced: true
    });
    await recordCubbyEvent('write-health-ddc', {
      scope: 'health/ddc',
      cid: state.healthDataCID,
      bucket: state.healthDataBucket,
    });
    await publishToVault('health', {
      type: 'proofi.health.synced',
      context: 'proofi-extension',
      payload: {
        cid: state.healthDataCID,
        bucket: state.healthDataBucket,
        cubbyId: getCubbyId(),
        summary: state.healthDataSummary,
      },
    });
    
    renderHealthSummary();
    showSuccess('health', 'Health data encrypted and synced to DDC!');
    
  } catch (err) {
    showError('health', 'Sync failed: ' + err.message);
  } finally {
    $('#sync-progress').style.display = 'none';
  }
}

// ── Agents ─────────────────────────────────────────────────────────────────

function setupAgentHandlers() {
  $('#btn-agents').addEventListener('click', () => {
    loadAgents();
    checkPendingAgentRequest();
    showScreen('agents');
  });
  
  $('#btn-agents-back').addEventListener('click', () => {
    showScreen('dashboard');
  });
  
  // Modal handlers
  $('#modal-btn-deny').addEventListener('click', denyAgentRequest);
  $('#modal-btn-approve').addEventListener('click', approveAgentRequest);
  
  // Inline approve/deny buttons
  $('#btn-approve-agent').addEventListener('click', showApprovalModal);
  $('#btn-deny-agent').addEventListener('click', denyAgentRequest);
  
  // Expiry option handlers
  $$('input[name="modal-expiry"]').forEach(radio => {
    radio.addEventListener('change', () => {
      $$('.expiry-btn').forEach(btn => btn.classList.remove('selected'));
      radio.nextElementSibling.classList.add('selected');
    });
  });
}

async function loadAgents() {
  const result = await chrome.storage.local.get({ proofi_agents: [] });
  state.connectedAgents = result.proofi_agents.filter(a => 
    a.active && a.expiresAt > Date.now()
  );
  state.cubbyScopes = getKnownCubbyScopes();
  renderAgentsList();
  renderCubbySummary();
}

function renderAgentsList() {
  const container = $('#agents-list');
  const agents = getAgentDisplayList();
  
  if (agents.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="text-display" style="font-size: 2rem; color: var(--steel);">🤖</div>
        <p class="text-body-sm text-muted">No agents connected</p>
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
          <div class="text-body-sm text-muted">${agent.agentId.slice(0, 16)}...</div>
        </div>
      </div>
      <div class="agent-scopes">
        ${(agent.scopes || []).map(s => `<span class="scope-badge">${getScopeIcon(s)} ${escapeHtml(s)}</span>`).join('')}
      </div>
      <div class="agent-meta">
        <span class="text-body-sm text-muted">
          Expires ${formatTime(agent.expiresAt)}
        </span>
      </div>
      <button class="btn-danger btn-sm" onclick="revokeAgent('${escapeHtml(agent.agentId)}')">
        REVOKE
      </button>
    </div>
  `).join('');
}

function getAgentDisplayList() {
  const local = state.connectedAgents || [];
  const localIds = new Set(local.map((agent) => agent.agentId));
  const live = (state.vaultAgents || [])
    .filter((agent) => !localIds.has(agent.agentId))
    .map((agent) => ({
      agentId: agent.agentId,
      name: agent.manifest?.name || agent.agentId,
      scopes: [agent.scope].filter(Boolean),
      createdAt: new Date(agent.createdAt || Date.now()).getTime(),
      expiresAt: Date.now() + 86400000,
      active: agent.status === 'active' || agent.status === 'provisioning',
      cubbyId: getCubbyId(),
    }));
  return [...local, ...live];
}

function getScopeIcon(scope) {
  const icons = {
    sleep: '🌙',
    heart: '❤️',
    steps: '👟',
    hrv: '📈',
    bloodOxygen: '🫁',
    weight: '⚖️',
    activeEnergy: '🔥',
    health: '🏥'
  };
  return icons[scope] || '📦';
}

function formatTime(ts) {
  return new Date(ts).toLocaleString([], { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

async function checkPendingAgentRequest() {
  const result = await chrome.storage.local.get('proofi_pending_agent');
  state.pendingAgentRequest = result.proofi_pending_agent;
  
  if (state.pendingAgentRequest) {
    renderPendingRequest();
    $('#pending-request').style.display = 'block';
  } else {
    $('#pending-request').style.display = 'none';
  }
}

function renderPendingRequest() {
  const req = state.pendingAgentRequest;
  if (!req) return;
  
  $('#pending-agent-name').textContent = req.name || 'Unknown Agent';
  $('#pending-agent-origin').textContent = req.origin || 'Unknown origin';
  
  const scopesContainer = $('#pending-scopes');
  const scopes = req.scopes || req.dataTypes || [];
  
  scopesContainer.innerHTML = scopes.map(scope => {
    const typeInfo = HEALTH_DATA_TYPES[scope] || { name: scope, icon: '📦', sensitivity: 'medium' };
    return `
      <div class="scope-item">
        <span class="scope-icon">${typeInfo.icon}</span>
        <span class="scope-name">${typeInfo.name}</span>
        <span class="scope-sensitivity ${typeInfo.sensitivity}">${typeInfo.sensitivity.toUpperCase()}</span>
      </div>
    `;
  }).join('');
}

function showApprovalModal() {
  const req = state.pendingAgentRequest;
  if (!req) return;
  
  $('#modal-agent-name').textContent = req.name || 'Unknown Agent';
  $('#modal-agent-origin').textContent = req.origin || 'Unknown origin';
  
  const scopes = req.scopes || req.dataTypes || [];
  $('#modal-scopes').innerHTML = scopes.map(scope => {
    const typeInfo = HEALTH_DATA_TYPES[scope] || { name: scope, icon: '📦', sensitivity: 'medium' };
    return `
      <div class="scope-item">
        <span class="scope-icon">${typeInfo.icon}</span>
        <span class="scope-name">${typeInfo.name}</span>
        <span class="scope-sensitivity ${typeInfo.sensitivity}">${typeInfo.sensitivity.toUpperCase()}</span>
      </div>
    `;
  }).join('');
  
  $('#agent-approval-modal').style.display = 'flex';
}

async function approveAgentRequest() {
  const req = state.pendingAgentRequest;
  if (!req) return;
  
  // Get selected expiry
  const expiryRadio = document.querySelector('input[name="modal-expiry"]:checked');
  const expirySeconds = expiryRadio ? parseInt(expiryRadio.value) : 86400;
  
  // Generate capability token
  const token = await generateCapabilityToken({
    issuerAddress: state.address,
    issuerDID: `did:proofi:${state.address}`,
    cubbyId: state.cubbyId || getCubbyId(),
    agentId: req.agentId,
    agentName: req.name,
    scopes: req.scopes || req.dataTypes || [],
    bucketId: state.healthDataBucket || '1229',
    dataCid: state.healthDataCID,
    dek: state.healthDEK,
    expiresInSeconds: expirySeconds
  });
  
  // Store agent session
  const agentSession = {
    agentId: req.agentId,
    name: req.name,
    scopes: req.scopes || req.dataTypes || [],
    origin: req.origin,
    cubbyId: state.cubbyId || getCubbyId(),
    createdAt: Date.now(),
    expiresAt: Date.now() + (expirySeconds * 1000),
    active: true,
    tokenId: token.id
  };
  
  const result = await chrome.storage.local.get({ proofi_agents: [] });
  const agents = result.proofi_agents.filter(a => a.agentId !== req.agentId);
  agents.push(agentSession);
  
  await chrome.storage.local.set({ 
    proofi_agents: agents,
    proofi_pending_agent: null
  });
  await recordCubbyEvent('grant-agent', {
    agentId: req.agentId,
    agentName: req.name,
    scope: (req.scopes || req.dataTypes || []).join(', '),
  });
  await publishToVault('agents', {
    type: 'proofi.agent.granted',
    context: req.agentId,
    target: req.agentId,
    payload: {
      agentId: req.agentId,
      agentName: req.name,
      scopes: req.scopes || req.dataTypes || [],
      expiresAt: agentSession.expiresAt,
      cubbyId: getCubbyId(),
    },
  });
  
  state.pendingAgentRequest = null;
  
  // Send response to requesting page
  chrome.runtime.sendMessage({
    type: 'AGENT_APPROVED',
    payload: {
      agentId: req.agentId,
      token: token,
      cubbyId: state.cubbyId || getCubbyId(),
      healthDataCID: state.healthDataCID,
      bucketId: state.healthDataBucket
    }
  });
  
  // Close modal and refresh
  $('#agent-approval-modal').style.display = 'none';
  $('#pending-request').style.display = 'none';
  loadAgents();
  showToast('ACCESS GRANTED');
}

async function denyAgentRequest() {
  await chrome.storage.local.set({ proofi_pending_agent: null });
  state.pendingAgentRequest = null;
  
  chrome.runtime.sendMessage({
    type: 'AGENT_DENIED',
    payload: { reason: 'User denied access' }
  });
  
  $('#agent-approval-modal').style.display = 'none';
  $('#pending-request').style.display = 'none';
  showToast('ACCESS DENIED');
}

// Make revokeAgent available globally for onclick handlers
window.revokeAgent = async function(agentId) {
  if (!confirm('Revoke access for this agent?')) return;
  
  const result = await chrome.storage.local.get({ proofi_agents: [] });
  const revoked = result.proofi_agents.find(a => a.agentId === agentId);
  const agents = result.proofi_agents.filter(a => a.agentId !== agentId);
  
  await chrome.storage.local.set({ proofi_agents: agents });
  await recordCubbyEvent('revoke-agent', {
    agentId,
    agentName: revoked?.name,
    scope: (revoked?.scopes || []).join(', '),
  });
  await publishToVault('agents', {
    type: 'proofi.agent.revoked',
    context: agentId,
    target: agentId,
    payload: {
      agentId,
      agentName: revoked?.name,
      scopes: revoked?.scopes || [],
      cubbyId: getCubbyId(),
    },
  });
  loadAgents();
  showToast('ACCESS REVOKED');
};

// ── Boot ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  setupAuthHandlers();
  setupDashboardHandlers();
  setupSendHandlers();
  setupSignHandlers();
  setupMemoHandlers();
  setupCredentialHandlers();
  setupHealthHandlers();
  setupAgentHandlers();
  init().then(async () => {
    const params = new URLSearchParams(window.location.search);
    const storedView = await chrome.storage.local.get(['proofi_popup_view', 'proofi_pending_sign']);
    const view = params.get('view') || storedView.proofi_popup_view;
    if (view) await chrome.storage.local.remove('proofi_popup_view');

    if (view === 'sign-approve' || storedView.proofi_pending_sign) {
      loadPendingSignRequest();
      return;
    }
    if (view === 'agent-approve') {
      checkPendingAgentRequest().then(() => {
        if (state.pendingAgentRequest) {
          showScreen('agents');
          showApprovalModal();
        }
      });
    }
  });
  
  // Check for agent approval view
});
