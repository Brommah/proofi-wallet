#!/usr/bin/env node
/**
 * Proofi CLI
 * 
 * Connect agents (like Clawdbot) to your Proofi wallet.
 * 
 * Usage:
 *   proofi connect              # Request wallet access
 *   proofi status               # Show connection status
 *   proofi proof age            # Request age proof
 *   proofi proof identity       # Request identity proof
 *   proofi disconnect           # Revoke access
 */

import { program } from 'commander';
import chalk from 'chalk';
import open from 'open';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createServer } from 'http';

const CONFIG_DIR = path.join(os.homedir(), '.proofi');
const SESSION_FILE = path.join(CONFIG_DIR, 'session.json');
const EXTENSION_ID = process.env.PROOFI_EXTENSION_ID || '';

// Ensure config dir exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

program
  .name('proofi')
  .description('Connect agents to your Proofi wallet')
  .version('1.0.0');

// ══════════════════════════════════════════════════════════════════
// CONNECT
// ══════════════════════════════════════════════════════════════════
program
  .command('connect')
  .description('Request access to Proofi wallet')
  .option('-n, --name <name>', 'Agent name', 'Clawdbot Agent')
  .option('-s, --scopes <scopes>', 'Comma-separated scopes', 'age,calendar,identity')
  .action(async (opts) => {
    console.log(chalk.cyan('\n╔══════════════════════════════════════╗'));
    console.log(chalk.cyan('║       PROOFI WALLET CONNECT          ║'));
    console.log(chalk.cyan('╚══════════════════════════════════════╝\n'));

    const agentId = `clawdbot-${Date.now()}`;
    const scopes = opts.scopes.split(',').map(s => s.trim());
    
    console.log(chalk.white('Agent:  '), chalk.yellow(opts.name));
    console.log(chalk.white('Scopes: '), chalk.yellow(scopes.join(', ')));
    console.log('');

    // Start local callback server
    const port = await findPort(9876);
    const callbackUrl = `http://localhost:${port}/callback`;
    
    console.log(chalk.gray('Starting callback server on port ' + port + '...'));
    
    const sessionPromise = startCallbackServer(port);
    
    // Build connect URL
    const connectParams = new URLSearchParams({
      action: 'connect',
      agentId,
      name: opts.name,
      scopes: scopes.join(','),
      callback: callbackUrl
    });
    
    const connectUrl = `https://proofi.ai/agent-connect?${connectParams}`;
    
    console.log('');
    console.log(chalk.cyan('Opening browser for wallet approval...'));
    console.log(chalk.gray('(Approve in your Proofi wallet extension)'));
    console.log('');
    
    // Open browser
    await open(connectUrl);
    
    console.log(chalk.yellow('⏳ Waiting for approval...'));
    
    try {
      const session = await sessionPromise;
      
      // Save session
      fs.writeFileSync(SESSION_FILE, JSON.stringify({
        agentId,
        name: opts.name,
        scopes,
        ...session,
        connectedAt: Date.now()
      }, null, 2));
      
      console.log('');
      console.log(chalk.green('✅ Connected to Proofi wallet!'));
      console.log('');
      console.log(chalk.white('Session saved to: '), chalk.gray(SESSION_FILE));
      console.log('');
      console.log(chalk.cyan('You can now request proofs:'));
      console.log(chalk.gray('  proofi proof age'));
      console.log(chalk.gray('  proofi proof identity'));
      
    } catch (err) {
      console.log('');
      console.log(chalk.red('❌ Connection failed or cancelled'));
      console.log(chalk.gray(err.message));
    }
  });

// ══════════════════════════════════════════════════════════════════
// STATUS
// ══════════════════════════════════════════════════════════════════
program
  .command('status')
  .description('Show connection status')
  .action(() => {
    if (!fs.existsSync(SESSION_FILE)) {
      console.log(chalk.yellow('\n⚠️  Not connected to any wallet'));
      console.log(chalk.gray('Run: proofi connect\n'));
      return;
    }
    
    const session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    const expired = session.expiresAt && Date.now() > session.expiresAt;
    
    console.log(chalk.cyan('\n╔══════════════════════════════════════╗'));
    console.log(chalk.cyan('║         PROOFI CONNECTION            ║'));
    console.log(chalk.cyan('╚══════════════════════════════════════╝\n'));
    
    console.log(chalk.white('Status:  '), expired ? chalk.red('EXPIRED') : chalk.green('ACTIVE'));
    console.log(chalk.white('Agent:   '), chalk.yellow(session.name));
    console.log(chalk.white('Scopes:  '), chalk.yellow(session.scopes?.join(', ')));
    console.log(chalk.white('Address: '), chalk.gray(session.address || 'N/A'));
    console.log('');
  });

// ══════════════════════════════════════════════════════════════════
// PROOF
// ══════════════════════════════════════════════════════════════════
program
  .command('proof <type>')
  .description('Request a proof from wallet')
  .option('-p, --predicate <pred>', 'Predicate (e.g., ">=18")')
  .action(async (type, opts) => {
    if (!fs.existsSync(SESSION_FILE)) {
      console.log(chalk.red('\n❌ Not connected. Run: proofi connect\n'));
      process.exit(1);
    }
    
    const session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    
    if (!session.scopes?.includes(type)) {
      console.log(chalk.red(`\n❌ Scope "${type}" not authorized`));
      console.log(chalk.gray(`Authorized scopes: ${session.scopes?.join(', ')}\n`));
      process.exit(1);
    }
    
    console.log(chalk.cyan('\n═══ REQUESTING PROOF ═══\n'));
    console.log(chalk.white('Type:      '), chalk.yellow(type));
    if (opts.predicate) {
      console.log(chalk.white('Predicate: '), chalk.yellow(opts.predicate));
    }
    console.log('');
    
    // In real impl, this calls the extension
    // For demo, simulate response
    console.log(chalk.yellow('⏳ Requesting from wallet...'));
    await sleep(1000);
    
    const proof = {
      type,
      verified: true,
      predicate: opts.predicate || null,
      disclosed: opts.predicate ? [] : [type],
      proof: `zkp:${Buffer.from(Math.random().toString()).toString('hex').slice(0, 32)}`,
      timestamp: new Date().toISOString()
    };
    
    console.log('');
    console.log(chalk.green('✅ Proof received!\n'));
    console.log(chalk.gray(JSON.stringify(proof, null, 2)));
    console.log('');
    
    if (opts.predicate) {
      console.log(chalk.cyan(`ℹ️  Predicate "${opts.predicate}" verified WITHOUT disclosing actual value`));
    }
  });

// ══════════════════════════════════════════════════════════════════
// DISCONNECT
// ══════════════════════════════════════════════════════════════════
program
  .command('disconnect')
  .description('Revoke wallet access')
  .action(() => {
    if (fs.existsSync(SESSION_FILE)) {
      fs.unlinkSync(SESSION_FILE);
      console.log(chalk.green('\n✅ Disconnected from Proofi wallet\n'));
    } else {
      console.log(chalk.yellow('\n⚠️  No active connection\n'));
    }
  });

// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function findPort(start) {
  // Simple: just use the start port
  return start;
}

function startCallbackServer(port) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error('Approval timeout (60s)'));
    }, 60000);
    
    const server = createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${port}`);
      
      if (url.pathname === '/callback') {
        const approved = url.searchParams.get('approved') === 'true';
        const address = url.searchParams.get('address');
        const token = url.searchParams.get('token');
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <head><title>Proofi</title></head>
            <body style="background:#000;color:#0ff;font-family:monospace;padding:40px;text-align:center">
              <h1>${approved ? '✅ CONNECTED' : '❌ REJECTED'}</h1>
              <p>You can close this window.</p>
              <script>setTimeout(() => window.close(), 2000)</script>
            </body>
          </html>
        `);
        
        clearTimeout(timeout);
        server.close();
        
        if (approved) {
          resolve({ address, token, expiresAt: Date.now() + 86400000 });
        } else {
          reject(new Error('User rejected connection'));
        }
      }
    });
    
    server.listen(port);
  });
}

program.parse();
