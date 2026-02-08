#!/usr/bin/env npx tsx
/**
 * Morning Briefing Generator
 * 
 * Reads memory + recent notes → generates actionable daily briefing
 * Runs 100% local on Ollama
 */

import { loadMemory, loadSoul, loadRecentNotes } from './memory.js';
import { query, healthCheck } from './ollama.js';
import chalk from 'chalk';

const MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

async function generateBriefing() {
  console.log(chalk.blue('🌅 Generating Morning Briefing...'));
  console.log(chalk.gray(`   Model: ${MODEL} (local)`));
  console.log('');
  
  // Check Ollama is running
  const healthy = await healthCheck();
  if (!healthy) {
    console.error(chalk.red('❌ Ollama is not running!'));
    console.log(chalk.gray('   Start with: ollama serve'));
    process.exit(1);
  }
  
  // Load context
  const memory = await loadMemory();
  const soul = await loadSoul();
  const notes = await loadRecentNotes(3);
  
  // Build context
  const today = new Date().toLocaleDateString('nl-NL', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
  
  const systemPrompt = `Je bent een persoonlijke assistent voor ${memory.owner.alias || 'Mart'}.
Communicatiestijl: direct, geen fluff, actie-gericht.
Antwoord in het Nederlands of Engels (mag wisselen).`;

  const userPrompt = `Genereer een ochtend briefing voor ${today}.

## Huidige Prioriteiten
${memory.priorities.this_week?.map((p: string) => `- ${p}`).join('\n') || '- Geen prioriteiten gevonden'}

## Blockers
${memory.priorities.blockers?.map((b: string) => `- ${b}`).join('\n') || '- Geen blockers'}

## Actieve Automaties
${memory.automations?.map((a: { name: string; purpose: string }) => `- ${a.name}: ${a.purpose}`).join('\n') || '- Geen automaties'}

## Recente Activiteit
${notes.map(n => `### ${n.date}\n${n.summary}`).join('\n\n') || 'Geen recente notities'}

---

Geef:
1. **Top 3 acties voor vandaag** (specifiek, actionable)
2. **Belangrijke deadlines** deze week
3. **Potentiële issues** om in de gaten te houden

Wees beknopt. Max 200 woorden.`;

  console.log(chalk.yellow('💭 Thinking...\n'));
  
  const response = await query(systemPrompt, userPrompt, MODEL);
  
  console.log(chalk.green('━'.repeat(60)));
  console.log(chalk.bold(`\n📋 BRIEFING - ${today.toUpperCase()}\n`));
  console.log(response);
  console.log(chalk.green('\n' + '━'.repeat(60)));
  
  // Save to memory
  const briefingNote = `# Ochtend Briefing - ${today}\n\n${response}`;
  console.log(chalk.gray('\n✓ Briefing generated locally (no cloud)'));
}

generateBriefing().catch(e => {
  console.error(chalk.red('Error:'), e.message);
  process.exit(1);
});
