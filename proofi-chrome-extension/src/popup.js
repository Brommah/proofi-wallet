/**
 * Proofi Wallet — Chrome Extension Popup
 * Handles auth flow, wallet management, and DDC storage.
 */

import { deriveSeedFromPin, encryptSeed, decryptSeed } from './lib/crypto.js';
import { createKeypair, createAuthHeaders, initCrypto } from './lib/keyring.js';
import { sendOtp, verifyOtp, registerAddress, storeMemo, storeCredential, listItems } from './lib/api.js';
import { getWalletState, saveWalletState, clearWalletState } from './lib/storage.js';

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

// ── Boot ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  setupAuthHandlers();
  setupDashboardHandlers();
  setupMemoHandlers();
  setupCredentialHandlers();
  init();
});
