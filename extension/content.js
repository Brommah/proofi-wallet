(function(){chrome.runtime.sendMessage({type:"GET_WALLET_STATE"},e=>{if(chrome.runtime.lastError){console.log("[Proofi Extension] Could not get wallet state:",chrome.runtime.lastError.message),o();return}e&&e.connected&&e.address?(console.log("[Proofi Extension] Wallet connected, injecting data for",e.address.slice(0,8)+"..."),i(e)):(console.log("[Proofi Extension] No connected wallet, showing connect banner"),o())}),chrome.storage.onChanged.addListener((e,t)=>{t==="local"&&(e.proofi_connected?.newValue===!0&&e.proofi_address?.newValue&&(console.log("[Proofi Extension] Wallet state changed \u2014 auto-connecting"),r(),i({address:e.proofi_address.newValue,email:e.proofi_email?.newValue||"",connected:!0})),(e.proofi_connected?.newValue===!1||e.proofi_connected&&!e.proofi_connected.newValue)&&(console.log("[Proofi Extension] Wallet disconnected"),d(),o()))});function i(e){let t=document.createElement("script");t.src=chrome.runtime.getURL("inject.js"),t.dataset.proofiAddress=e.address,t.dataset.proofiEmail=e.email||"",t.dataset.proofiToken=e.token||"",t.dataset.proofiConnected="true",(document.head||document.documentElement).appendChild(t),t.addEventListener("load",()=>t.remove())}function d(){let e=document.createElement("script");e.textContent=`
      window.__proofi_extension__ = { connected: false, address: null, email: null };
      window.dispatchEvent(new CustomEvent('proofi-extension-disconnected'));
    `,(document.head||document.documentElement).appendChild(e),e.remove()}function o(){if(document.getElementById("proofi-ext-connect-banner"))return;let e=document.createElement("div");e.id="proofi-ext-connect-banner",e.innerHTML=`
      <div style="
        position:fixed; bottom:24px; right:24px; z-index:999998;
        background:#0A0A0A; border:2px solid #00E5FF;
        border-radius:16px; padding:20px 24px;
        box-shadow:0 8px 32px rgba(0,229,255,0.15), 0 0 0 1px rgba(0,229,255,0.1);
        font-family:'Inter',system-ui,sans-serif; max-width:320px;
        animation: proofi-slide-in 0.3s ease;
      ">
        <style>
          @keyframes proofi-slide-in { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
          @keyframes proofi-pulse { 0%,100% { box-shadow:0 0 0 0 rgba(0,229,255,0.4); } 50% { box-shadow:0 0 0 8px rgba(0,229,255,0); } }
        </style>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#00E5FF,#00FF88);display:flex;align-items:center;justify-content:center;font-size:18px;">\u{1F510}</div>
          <div>
            <div style="font-size:14px;font-weight:700;color:#F0F0F0;">Proofi Wallet</div>
            <div style="font-size:11px;color:#888;">Connect to use this app</div>
          </div>
          <button id="proofi-ext-close-banner" style="
            margin-left:auto; background:none; border:none; color:#555;
            font-size:18px; cursor:pointer; padding:4px; line-height:1;
          ">\u2715</button>
        </div>
        <button id="proofi-ext-connect-btn" style="
          width:100%; padding:12px; border:none; border-radius:10px;
          background:linear-gradient(135deg,#00E5FF,#00FF88); color:#000;
          font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:700;
          letter-spacing:2px; cursor:pointer; text-transform:uppercase;
          transition:all 0.2s; animation: proofi-pulse 2s infinite;
        ">\u26A1 CONNECT WALLET</button>
        <div style="font-size:10px;color:#555;text-align:center;margin-top:8px;">
          Self-custodial \xB7 On-chain credentials \xB7 DDC storage
        </div>
      </div>
    `,document.body.appendChild(e),document.getElementById("proofi-ext-connect-btn").addEventListener("click",()=>{chrome.runtime.sendMessage({type:"OPEN_LOGIN_POPUP"},t=>{if(t?.method==="popup"){let n=document.getElementById("proofi-ext-connect-btn");n.textContent="\u23F3 WAITING FOR LOGIN...",n.style.animation="none",n.style.opacity="0.7"}else{let n=document.getElementById("proofi-ext-connect-btn");n.textContent="\u23F3 WAITING FOR LOGIN...",n.style.animation="none",n.style.opacity="0.7"}})}),document.getElementById("proofi-ext-close-banner").addEventListener("click",()=>{r()})}function r(){let e=document.getElementById("proofi-ext-connect-banner");e&&e.remove()}

// --- Sign request relay: page ↔ background ---
window.addEventListener("__proofi_sign_request__",function(e){
  let detail=e.detail;
  if(!detail||!detail.message)return;
  console.log("[Proofi Extension] Sign request received, relaying to background");
  chrome.runtime.sendMessage({type:"SIGN_MESSAGE",message:detail.message,requestId:detail.requestId},function(resp){
    let responseDetail;
    if(chrome.runtime.lastError){
      responseDetail={requestId:detail.requestId,error:chrome.runtime.lastError.message};
    }else if(resp&&resp.error){
      responseDetail={requestId:detail.requestId,error:resp.error};
    }else if(resp&&resp.signature){
      responseDetail={requestId:detail.requestId,signature:resp.signature};
    }else{
      responseDetail={requestId:detail.requestId,error:"No response from wallet"};
    }
    // Dispatch response back to page context via inline script
    let s=document.createElement("script");
    s.textContent="window.dispatchEvent(new CustomEvent('__proofi_sign_response__',{detail:"+JSON.stringify(responseDetail)+"}));";
    (document.head||document.documentElement).appendChild(s);
    s.remove();
  });
});
})();
