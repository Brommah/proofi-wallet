/**
 * Proofi Wallet — Chrome Extension Popup
 * Handles auth flow, wallet management, DDC storage, and health data.
 */

import { deriveSeedFromPin, encryptSeed, decryptSeed } from './lib/crypto.js';
import { createKeypair, createAuthHeaders, initCrypto } from './lib/keyring.js';
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
};

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
    btn.textContent = text || 'LOADING...';
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.originalText || btn.textContent;
    btn.disabled = false;
  }
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
      
      // Update badge
      updateBadge(true);
      
      // Show dashboard
      renderDashboard();
      showScreen('dashboard');
      
      // Load stored data immediately (no PIN needed for viewing)
      loadItems();
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
  const btnBackEmail = $('#btn-back-email');
  const pinInput = $('#input-pin');
  const btnSetupPin = $('#btn-setup-pin');
  
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
  
  // Back to email
  btnBackEmail.addEventListener('click', () => {
    $('#step-otp').style.display = 'none';
    $('#step-email').style.display = 'flex';
    hideError('otp');
    // Clear OTP digits
    $$('.otp-digit').forEach(d => { d.value = ''; d.classList.remove('filled'); });
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
    
    btnSetupPin.disabled = pin.length < 4;
    hideError('pin');
  });
  
  pinInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !btnSetupPin.disabled) {
      btnSetupPin.click();
    }
  });
  
  // Setup PIN
  btnSetupPin.addEventListener('click', handleSetupPin);
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
      $('#pin-subtitle').textContent = 'Enter your PIN to restore your wallet.';
      $('#btn-setup-pin').textContent = 'RESTORE WALLET';
    } else {
      $('#pin-title').textContent = 'Create Your PIN';
      $('#pin-subtitle').textContent = 'This PIN derives your wallet keys. Remember it — it cannot be recovered.';
      $('#btn-setup-pin').textContent = 'CREATE WALLET';
    }
    
    $('#input-pin').focus();
  } catch (err) {
    showError('otp', err.message);
    // Clear OTP digits
    $$('.otp-digit').forEach(d => { d.value = ''; d.classList.remove('filled'); });
    document.querySelector('.otp-digit')?.focus();
  } finally {
    $('#loading-otp').style.display = 'none';
  }
}

async function handleSetupPin() {
  const pin = $('#input-pin').value;
  if (pin.length < 4) return;
  
  const btn = $('#btn-setup-pin');
  setLoading(btn, true, 'DERIVING KEYS...');
  $('#loading-pin').style.display = 'flex';
  hideError('pin');
  
  try {
    // Derive seed from PIN + salt
    const seed = await deriveSeedFromPin(pin, state.derivationSalt);
    
    // Create sr25519 keypair
    const keypair = await createKeypair(seed);
    
    // For existing users: verify address matches
    if (state.hasExistingWallet && state.existingAddress) {
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
    state.encryptedSeed = encryptedSeed;
    state.isUnlocked = true;
    
    // Update badge
    updateBadge(true);
    
    // Show dashboard
    renderDashboard();
    showScreen('dashboard');
    
    // Load items
    loadItems();
    
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
  $('#btn-refresh').addEventListener('click', loadItems);
  
  // Unlock
  $('#btn-unlock').addEventListener('click', () => {
    showUnlockUI('dashboard');
  });
  
  // Disconnect
  $('#btn-disconnect').addEventListener('click', handleDisconnect);
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
  state.isUnlocked = true;
  renderDashboard();
}

function showUnlockUI(returnScreen) {
  // Simple inline unlock on dashboard
  const pin = prompt('Enter your PIN to unlock signing:');
  if (!pin) return;
  
  unlockWallet(pin).then(() => {
    showToast('WALLET UNLOCKED');
    loadItems();
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
  
  state = {
    screen: 'login',
    email: null,
    token: null,
    derivationSalt: null,
    hasExistingWallet: false,
    existingAddress: null,
    address: null,
    keypair: null,
    encryptedSeed: null,
    isUnlocked: false,
    storedItems: [],
  };
  
  updateBadge(false);
  
  // Reset login form
  $('#input-email').value = '';
  $('#input-pin').value = '';
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
  renderAgentsList();
}

function renderAgentsList() {
  const container = $('#agents-list');
  
  if (state.connectedAgents.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="text-display" style="font-size: 2rem; color: var(--steel);">🤖</div>
        <p class="text-body-sm text-muted">No agents connected</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = state.connectedAgents.map(agent => `
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
  
  state.pendingAgentRequest = null;
  
  // Send response to requesting page
  chrome.runtime.sendMessage({
    type: 'AGENT_APPROVED',
    payload: {
      agentId: req.agentId,
      token: token,
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
  const agents = result.proofi_agents.filter(a => a.agentId !== agentId);
  
  await chrome.storage.local.set({ proofi_agents: agents });
  loadAgents();
  showToast('ACCESS REVOKED');
};

// ── Boot ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  setupAuthHandlers();
  setupDashboardHandlers();
  setupMemoHandlers();
  setupCredentialHandlers();
  setupHealthHandlers();
  setupAgentHandlers();
  init();
  
  // Check for agent approval view
  const params = new URLSearchParams(window.location.search);
  if (params.get('view') === 'agent-approve') {
    checkPendingAgentRequest().then(() => {
      if (state.pendingAgentRequest) {
        showScreen('agents');
        showApprovalModal();
      }
    });
  }
});
