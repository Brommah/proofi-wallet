#!/usr/bin/env node

/**
 * Proofi CLI Health Analyzer
 * 
 * Fetches encrypted health data from DDC, decrypts it locally,
 * and runs analysis through Ollama (local LLM).
 * 
 * Usage:
 *   node analyze.js --token '<JSON token>'
 *   node analyze.js --file token.json
 *   cat token.json | node analyze.js
 *   pbpaste | node analyze.js  # macOS
 * 
 * Requirements:
 *   - Node.js 18+
 *   - Ollama running locally (http://localhost:11434)
 *   - npm install tweetnacl tweetnacl-util
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Try to load tweetnacl
let nacl, naclUtil;
try {
  nacl = require('tweetnacl');
  naclUtil = require('tweetnacl-util');
} catch (e) {
  console.error('Missing dependencies. Run:');
  console.error('  npm install tweetnacl tweetnacl-util');
  process.exit(1);
}

// Configuration
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  const timestamp = new Date().toISOString().slice(11, 19);
  console.error(`${colors.dim}[${timestamp}]${colors.reset} ${colors[color]}${msg}${colors.reset}`);
}

function logStep(step, msg) {
  console.error(`\n${colors.cyan}[${step}]${colors.reset} ${colors.bright}${msg}${colors.reset}`);
}

// Fetch URL with promise
function fetch(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// POST to URL with streaming response
function postStream(url, body, onChunk) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    
    const req = protocol.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errData = '';
        res.on('data', chunk => errData += chunk);
        res.on('end', () => reject(new Error(`HTTP ${res.statusCode}: ${errData}`)));
        return;
      }
      
      let buffer = '';
      res.on('data', (chunk) => {
        buffer += chunk.toString();
        
        // Process line by line (Ollama sends NDJSON)
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const json = JSON.parse(line);
              onChunk(json);
            } catch (e) {
              // Skip malformed lines
            }
          }
        }
      });
      
      res.on('end', () => {
        // Process remaining buffer
        if (buffer.trim()) {
          try {
            const json = JSON.parse(buffer);
            onChunk(json);
          } catch (e) {}
        }
        resolve();
      });
    });
    
    req.on('error', reject);
    req.setTimeout(120000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(body);
    req.end();
  });
}

// AES-256-GCM decryption using Web Crypto API (Node.js built-in)
async function decryptAES(ciphertextB64, ivB64, key) {
  const { subtle } = require('crypto').webcrypto;
  
  const ciphertext = naclUtil.decodeBase64(ciphertextB64);
  const iv = naclUtil.decodeBase64(ivB64);
  
  const cryptoKey = await subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const plaintext = await subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    cryptoKey,
    ciphertext
  );
  
  return new TextDecoder().decode(plaintext);
}

// Unwrap DEK using X25519 + XSalsa20-Poly1305
function unwrapDEK(wrappedDEK, agentSecretKey) {
  const ciphertext = naclUtil.decodeBase64(wrappedDEK.ciphertext);
  const ephemeralPubKey = naclUtil.decodeBase64(wrappedDEK.ephemeralPublicKey);
  const nonce = naclUtil.decodeBase64(wrappedDEK.nonce);
  const secretKey = naclUtil.decodeBase64(agentSecretKey);
  
  const dek = nacl.box.open(ciphertext, nonce, ephemeralPubKey, secretKey);
  
  if (!dek) {
    throw new Error('Failed to unwrap DEK - decryption error');
  }
  
  return dek;
}

// Read token from various sources
async function readToken() {
  const args = process.argv.slice(2);
  
  // Check for --token argument
  const tokenArgIndex = args.indexOf('--token');
  if (tokenArgIndex !== -1 && args[tokenArgIndex + 1]) {
    return JSON.parse(args[tokenArgIndex + 1]);
  }
  
  // Check for --file argument
  const fileArgIndex = args.indexOf('--file');
  if (fileArgIndex !== -1 && args[fileArgIndex + 1]) {
    const content = fs.readFileSync(args[fileArgIndex + 1], 'utf8');
    return JSON.parse(content);
  }
  
  // Check for positional file argument
  if (args[0] && !args[0].startsWith('--')) {
    if (fs.existsSync(args[0])) {
      const content = fs.readFileSync(args[0], 'utf8');
      return JSON.parse(content);
    }
    // Try parsing as JSON directly
    try {
      return JSON.parse(args[0]);
    } catch (e) {
      // Not JSON, assume it's a file path that doesn't exist
      throw new Error(`File not found: ${args[0]}`);
    }
  }
  
  // Read from stdin (pipe)
  if (!process.stdin.isTTY) {
    return new Promise((resolve, reject) => {
      let data = '';
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', chunk => data += chunk);
      process.stdin.on('end', () => {
        try {
          resolve(JSON.parse(data.trim()));
        } catch (e) {
          reject(new Error('Invalid JSON from stdin'));
        }
      });
      process.stdin.on('error', reject);
    });
  }
  
  // No input provided
  throw new Error('No token provided. Use --token, --file, or pipe JSON via stdin.');
}

// Build health analysis prompt
function buildAnalysisPrompt(healthData) {
  const sleepData = healthData.sleep || [];
  const heartData = healthData.heartRate || [];
  
  let prompt = `You are a health data analyst. Analyze the following health data and provide insights.

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "analysis": {
    "avgSleep": <number>,
    "avgQuality": <number 0-100>,
    "avgDeep": <number hours>,
    "avgRem": <number hours>,
    "avgHR": <number bpm>,
    "avgRestingHR": <number bpm>,
    "avgHRV": <number ms>,
    "maxHR": <number bpm>,
    "minHR": <number bpm>,
    "sleepScore": <number 0-100>,
    "heartScore": <number 0-100>
  },
  "recommendations": [
    "<recommendation 1>",
    "<recommendation 2>",
    "<recommendation 3>"
  ],
  "summary": "<2-3 sentence summary of overall health>"
}

=== HEALTH DATA ===

`;

  if (sleepData.length > 0) {
    prompt += `SLEEP DATA (${sleepData.length} nights):\n`;
    // Show last 7 days summary
    const recentSleep = sleepData.slice(-7);
    prompt += `Last 7 nights: ${recentSleep.map(s => 
      `${s.date}: ${s.duration.toFixed(1)}h sleep, quality ${s.quality}%, deep ${s.deep.toFixed(1)}h`
    ).join('\n')}\n\n`;
    
    // Overall stats
    const avgDuration = sleepData.reduce((a, s) => a + s.duration, 0) / sleepData.length;
    const avgQuality = sleepData.reduce((a, s) => a + s.quality, 0) / sleepData.length;
    prompt += `Average: ${avgDuration.toFixed(1)}h sleep, ${avgQuality.toFixed(0)}% quality\n\n`;
  }
  
  if (heartData.length > 0) {
    prompt += `HEART RATE DATA (${heartData.length} readings):\n`;
    
    // Group by context
    const byContext = {};
    heartData.forEach(h => {
      if (!byContext[h.context]) byContext[h.context] = [];
      byContext[h.context].push(h.bpm);
    });
    
    for (const [context, bpms] of Object.entries(byContext)) {
      const avg = bpms.reduce((a, b) => a + b, 0) / bpms.length;
      const min = Math.min(...bpms);
      const max = Math.max(...bpms);
      prompt += `${context}: avg ${avg.toFixed(0)} bpm (range ${min}-${max})\n`;
    }
    
    // HRV data
    const hrvValues = heartData.map(h => h.variability).filter(v => v);
    if (hrvValues.length > 0) {
      const avgHRV = hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length;
      prompt += `\nHRV average: ${avgHRV.toFixed(0)} ms\n`;
    }
  }
  
  prompt += `\n=== END DATA ===\n\nRespond with JSON only, no additional text.`;
  
  return prompt;
}

// Main analysis function
async function main() {
  console.error(`\n${colors.bright}${colors.cyan}╔══════════════════════════════════════╗${colors.reset}`);
  console.error(`${colors.bright}${colors.cyan}║    Proofi CLI Health Analyzer        ║${colors.reset}`);
  console.error(`${colors.bright}${colors.cyan}║    Local Ollama + Encrypted DDC      ║${colors.reset}`);
  console.error(`${colors.bright}${colors.cyan}╚══════════════════════════════════════╝${colors.reset}\n`);
  
  try {
    // Step 1: Read token
    logStep('1/5', 'Reading capability token...');
    const token = await readToken();
    
    log(`Token ID: ${token.id}`, 'green');
    log(`Scopes: ${(token.scopes || []).join(', ')}`, 'dim');
    log(`Expires: ${new Date(token.exp * 1000).toLocaleString()}`, 'dim');
    
    // Validate expiry
    if (token.exp && token.exp < Date.now() / 1000) {
      log('Token has expired!', 'red');
      process.exit(1);
    }
    
    // Step 2: Fetch encrypted data from DDC
    logStep('2/5', 'Fetching encrypted data from DDC...');
    
    const cdnUrl = token.cdnUrl || `https://cdn.ddc-dragon.com/${token.bucketId}/${token.cid}`;
    log(`CDN URL: ${cdnUrl}`, 'dim');
    
    const encryptedJson = await fetch(cdnUrl);
    const encryptedData = JSON.parse(encryptedJson);
    
    log(`Fetched ${encryptedJson.length} bytes`, 'green');
    log(`Algorithm: ${encryptedData.algorithm || 'AES-256-GCM'}`, 'dim');
    
    // Step 3: Unwrap DEK and decrypt
    logStep('3/5', 'Decrypting with agent key...');
    
    if (!token.agentKey) {
      throw new Error('Token missing agentKey - cannot decrypt');
    }
    if (!token.wrappedDEK) {
      throw new Error('Token missing wrappedDEK - cannot decrypt');
    }
    
    log('Unwrapping DEK (X25519 + XSalsa20-Poly1305)...', 'dim');
    const dek = unwrapDEK(token.wrappedDEK, token.agentKey);
    log(`DEK recovered (${dek.length} bytes)`, 'green');
    
    log('Decrypting data (AES-256-GCM)...', 'dim');
    const decryptedJson = await decryptAES(encryptedData.ciphertext, encryptedData.iv, dek);
    const healthData = JSON.parse(decryptedJson);
    
    const sleepCount = healthData.sleep?.length || 0;
    const heartCount = healthData.heartRate?.length || 0;
    log(`Decrypted: ${sleepCount} sleep records, ${heartCount} heart rate readings`, 'green');
    
    // Step 4: Send to Ollama
    logStep('4/5', `Analyzing with Ollama (${OLLAMA_MODEL})...`);
    
    const prompt = buildAnalysisPrompt(healthData);
    log(`Prompt: ${prompt.length} chars`, 'dim');
    
    // Check if Ollama is running
    try {
      await fetch(`${OLLAMA_URL}/api/tags`);
    } catch (e) {
      log(`Ollama not running at ${OLLAMA_URL}`, 'red');
      log('Start Ollama with: ollama serve', 'yellow');
      process.exit(1);
    }
    
    console.error(`\n${colors.magenta}--- Ollama Response ---${colors.reset}\n`);
    
    let fullResponse = '';
    
    await postStream(
      `${OLLAMA_URL}/api/generate`,
      JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: true,
        options: {
          temperature: 0.3,
          num_predict: 1024
        }
      }),
      (chunk) => {
        if (chunk.response) {
          process.stdout.write(chunk.response);
          fullResponse += chunk.response;
        }
      }
    );
    
    console.error(`\n\n${colors.magenta}--- End Response ---${colors.reset}\n`);
    
    // Step 5: Parse and output results
    logStep('5/5', 'Processing results...');
    
    // Try to extract JSON from response
    let results;
    try {
      // Find JSON in response (might have extra text)
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        results = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      log(`Could not parse JSON response: ${e.message}`, 'yellow');
      results = {
        analysis: {},
        recommendations: ['Analysis completed but response was not valid JSON'],
        rawResponse: fullResponse
      };
    }
    
    // Add metadata
    results.model = OLLAMA_MODEL;
    results.recordsAnalyzed = sleepCount + heartCount;
    results.analyzedAt = new Date().toISOString();
    results.tokenId = token.id;
    
    // Output final JSON to stdout
    console.log(JSON.stringify(results, null, 2));
    
    log('Analysis complete!', 'green');
    
    // If callback URL provided, POST results
    if (token.callback) {
      log(`Sending results to callback: ${token.callback}`, 'dim');
      try {
        // Simple POST (no streaming)
        const callbackUrl = new URL(token.callback);
        const protocol = callbackUrl.protocol === 'https:' ? https : http;
        
        await new Promise((resolve, reject) => {
          const body = JSON.stringify(results);
          const req = protocol.request({
            hostname: callbackUrl.hostname,
            port: callbackUrl.port,
            path: callbackUrl.pathname + callbackUrl.search,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(body)
            }
          }, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve();
            } else {
              reject(new Error(`Callback returned ${res.statusCode}`));
            }
          });
          
          req.on('error', reject);
          req.write(body);
          req.end();
        });
        
        log('Results sent to callback', 'green');
      } catch (e) {
        log(`Callback failed: ${e.message}`, 'yellow');
      }
    }
    
  } catch (err) {
    console.error(`\n${colors.red}Error: ${err.message}${colors.reset}\n`);
    if (process.env.DEBUG) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

// Run
main();
