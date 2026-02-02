/**
 * @proofi/ui — Wallet UI entry point
 *
 * Responsibilities:
 * - Auth screens (OTP, Telegram)
 * - Sign confirmation dialogs
 * - Account overview
 * - Minimal, focused — no asset/collectible/exchange bloat
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
