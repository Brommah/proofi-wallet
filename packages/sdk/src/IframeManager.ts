/**
 * Manages the hidden wallet iframe lifecycle.
 *
 * Creates and injects a sandboxed iframe pointing to the wallet UI.
 * All communication flows through postMessage (via @proofi/comm).
 */
export class IframeManager {
  private iframe: HTMLIFrameElement | null = null;
  private walletUrl: string;

  constructor(walletUrl: string) {
    this.walletUrl = walletUrl;
  }

  /**
   * Create and inject the wallet iframe into the DOM.
   * Returns a promise that resolves when the iframe has loaded.
   */
  async create(): Promise<HTMLIFrameElement> {
    if (this.iframe) return this.iframe;

    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');

      iframe.src = this.walletUrl;
      iframe.id = 'proofi-wallet-iframe';
      iframe.allow = 'clipboard-read; clipboard-write';

      // Hidden but accessible for postMessage
      Object.assign(iframe.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '0',
        height: '0',
        border: 'none',
        opacity: '0',
        pointerEvents: 'none',
        zIndex: '-1',
      });

      iframe.onload = () => {
        this.iframe = iframe;
        resolve(iframe);
      };

      iframe.onerror = () => {
        reject(new Error(`Failed to load wallet iframe from ${this.walletUrl}`));
      };

      document.body.appendChild(iframe);
    });
  }

  /**
   * Get the iframe's contentWindow for postMessage communication.
   */
  getWindow(): Window {
    if (!this.iframe?.contentWindow) {
      throw new Error('Wallet iframe not initialized. Call create() first.');
    }
    return this.iframe.contentWindow;
  }

  /**
   * Get the iframe origin for secure postMessage.
   */
  getOrigin(): string {
    try {
      const url = new URL(this.walletUrl);
      return url.origin;
    } catch {
      return '*';
    }
  }

  /**
   * Show the iframe (e.g., for authentication flows).
   */
  show(options?: { width?: string; height?: string }): void {
    if (!this.iframe) return;

    Object.assign(this.iframe.style, {
      width: options?.width ?? '400px',
      height: options?.height ?? '600px',
      opacity: '1',
      pointerEvents: 'auto',
      zIndex: '999999',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      borderRadius: '12px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    });
  }

  /**
   * Hide the iframe back to invisible state.
   */
  hide(): void {
    if (!this.iframe) return;

    Object.assign(this.iframe.style, {
      width: '0',
      height: '0',
      opacity: '0',
      pointerEvents: 'none',
      zIndex: '-1',
      transform: 'none',
      boxShadow: 'none',
    });
  }

  /**
   * Remove the iframe from the DOM.
   */
  destroy(): void {
    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }
  }

  /**
   * Check if the iframe is created and loaded.
   */
  get isReady(): boolean {
    return this.iframe !== null && this.iframe.contentWindow !== null;
  }
}
