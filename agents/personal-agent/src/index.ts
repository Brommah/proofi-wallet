#!/usr/bin/env npx tsx
/**
 * Personal Agent - Privacy-First Local AI
 * 
 * NEVER sends data to:
 * - OpenAI
 * - Anthropic Cloud
 * - Any external LLM API
 * 
 * Runs entirely on Ollama local inference.
 */

import { loadMemory, loadSoul, loadRecentNotes } from './memory.js';
import { query } from './ollama.js';
import { readFileSync } from 'fs';

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

async function main() {
  console.log('🤖 Personal Agent starting (LOCAL ONLY - no cloud)');
  console.log(`📍 Model: ${OLLAMA_MODEL}`);
  console.log('');
  
  // Load context
  const memory = await loadMemory();
  const soul = await loadSoul();
  const recentNotes = await loadRecentNotes(3); // Last 3 days
  
  console.log(`📚 Loaded: ${memory.people.length} people, ${memory.automations.length} automations`);
  console.log(`📝 Recent notes: ${recentNotes.length} days`);
  console.log('');
  
  // Build system prompt from SOUL
  const systemPrompt = buildSystemPrompt(soul);
  
  // Example: Generate morning briefing
  const userPrompt = `Based on the context, what should Mart focus on today?

## Current Priorities
${memory.priorities.this_week.map((p: string) => `- ${p}`).join('\n')}

## Blockers
${memory.priorities.blockers.map((b: string) => `- ${b}`).join('\n')}

## Recent Activity
${recentNotes.map(n => `### ${n.date}\n${n.summary}`).join('\n\n')}

Give 3-5 actionable items for today. Be direct, no fluff.`;

  console.log('💭 Generating briefing...\n');
  
  const response = await query(systemPrompt, userPrompt, OLLAMA_MODEL);
  
  console.log('━'.repeat(50));
  console.log(response);
  console.log('━'.repeat(50));
}

function buildSystemPrompt(soul: any): string {
  return `You are ${soul.identity.name}, a personal assistant for ${soul.identity.owner}.

## Communication Style
${soul.communication.tone.map((t: string) => `- ${t}`).join('\n')}

## Never Say
${soul.communication.avoid.map((a: string) => `- "${a}"`).join('\n')}

## Rules
${soul.do.actions.slice(0, 5).map((a: string) => `- ${a}`).join('\n')}

Be direct. Be helpful. Take action.`;
}

main().catch(console.error);
