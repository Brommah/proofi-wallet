import { useEffect } from 'react';
import { useRequestStore, useAuthStore, useWalletStore } from '../stores';
import type { PendingRequest } from '../stores';

/**
 * Listens for postMessage events from the parent window
 * and routes them to the appropriate store.
 */
export function usePostMessage() {
  const setRequest = useRequestStore((s) => s.setRequest);
  const connect = useWalletStore((s) => s.connect);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const { data } = event;
      if (!data || typeof data.type !== 'string') return;

      switch (data.type) {
        case 'PROOFI_SIGN_REQUEST':
          setRequest({
            type: 'sign',
            id: data.id || crypto.randomUUID(),
            appName: data.appName || 'Unknown App',
            appOrigin: event.origin,
            category: data.category || 'transaction',
            method: data.method || 'signPayload',
            data: typeof data.data === 'string' ? data.data : JSON.stringify(data.data, null, 2),
          });
          break;

        case 'PROOFI_CONNECT_REQUEST':
          setRequest({
            type: 'connect',
            id: data.id || crypto.randomUUID(),
            appName: data.appName || 'Unknown App',
            appOrigin: event.origin,
            permissions: data.permissions || ['sign'],
          });
          break;

        case 'PROOFI_SET_ADDRESS':
          if (data.address) connect(data.address);
          break;

        case 'PROOFI_LOGOUT':
          useAuthStore.getState().logout();
          break;
      }
    };

    window.addEventListener('message', handler);
    // Notify parent we're ready
    window.parent.postMessage({ type: 'PROOFI_WALLET_READY' }, '*');

    return () => window.removeEventListener('message', handler);
  }, [setRequest, connect]);
}
