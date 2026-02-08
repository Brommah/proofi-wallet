/**
 * Proofi Wallet — Content Script
 * 
 * Detects dApps that use the Proofi SDK on the current page.
 * Acts as a bridge between the page and the extension popup.
 */

// Detect if the page uses ProofiSDK
let dappDetected = false;

function checkForDapp() {
  // Check for SDK script tags
  const scripts = document.querySelectorAll('script[src*="proofi"]');
  if (scripts.length > 0) {
    dappDetected = true;
    return;
  }

  // Check for SDK class on window (via injected script)
  const checkScript = document.createElement('script');
  checkScript.textContent = `
    if (window.ProofiSDK || window.__proofi__) {
      document.dispatchEvent(new CustomEvent('__proofi_detected__'));
    }
  `;
  document.documentElement.appendChild(checkScript);
  checkScript.remove();
}

// Listen for detection from page context
document.addEventListener('__proofi_detected__', () => {
  dappDetected = true;
  // Notify extension
  chrome.runtime.sendMessage({ type: 'PROOFI_DAPP_DETECTED', url: window.location.href });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PROOFI_CHECK_DAPP') {
    sendResponse({ hasDapp: dappDetected });
    return true;
  }
});

// Run detection after page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkForDapp);
} else {
  checkForDapp();
}

// Also check after a delay (for SPAs that load SDK dynamically)
setTimeout(checkForDapp, 2000);
