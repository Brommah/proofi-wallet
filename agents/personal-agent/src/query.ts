#!/usr/bin/env npx tsx
/**
 * Query Personal Agent
 * 
 * Ask questions with full memory context - 100% local
 * 
 * Usage: npm run query "What did I work on yesterday?"
 */

import { loadMemory, loadSoul, loadRecentNotes } from './memory.js';
import { query as llmQuery, healthCheck } from './ollama.js';
import chalk from 'chalk';

const MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

async function main() {
  const question = process.argv.slice(2).join(' ');
  
  if (!question) {
    console.log(chalk.yellow('Usage: npm run query "your question here"'));
    console.log(chalk.gray('Example: npm run query "What are my priorities this week?"'));
    process.exit(0);
  }
  
  console.log(chalk.blue('🔒 Personal Agent (LOCAL ONLY)'));
  console.log(chalk.gray(`   Model: ${MODEL}`));
  console.log('');
  
  // Check Ollama
  if (!(await healthCheck())) {
    console.error(chalk.red('❌ Ollama not running. Start with: ollama serve'));
    process.exit(1);
  }
  
  // Load context
  const memory = await loadMemory();
  const soul = await loadSoul();
  const notes = await loadRecentNotes(5);
  
  // Build context-aware system prompt
  const systemPrompt = `Je bent een persoonlijke assistent voor ${memory.owner.alias || 'Mart'}.
Je hebt toegang tot persoonlijke geheugen en context. Wees direct en behulpzaam.

## Bekende Mensen
${memory.people.slice(0, 5).map((p: { name: string; role: string }) => `- ${p.name}: ${p.role}`).join('\n')}

## Actieve Projecten
${memory.priorities.this_week?.slice(0, 3).join(', ') || 'Geen'}

## Stijl
- Direct, geen filler
- Nederlands/Engels mag
- Geef concrete antwoorden`;

  // Build user prompt with recent context
  const recentContext = notes.map(n => `[${n.date}] ${n.summary}`).join('\n');
  
  const userPrompt = `Recente activiteit:
${recentContext}

---

Vraag: ${question}`;

  console.log(chalk.yellow(`💭 "${question}"\n`));
  
  const response = await llmQuery(systemPrompt, userPrompt, MODEL);
  
  console.log(chalk.green('━'.repeat(50)));
  console.log(response);
  console.log(chalk.green('━'.repeat(50)));
  
  console.log(chalk.gray('\n✓ Answered locally (no cloud)'));
}

main().catch(e => {
  console.error(chalk.red('Error:'), e.message);
  process.exit(1);
});
