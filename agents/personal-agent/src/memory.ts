/**
 * Memory Loader - Parses MEMORY.md and SOUL.md
 * 
 * Extracts structured data from YAML frontmatter and markdown sections.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import matter from 'gray-matter';

const CLAWD_DIR = process.env.CLAWD_DIR || resolve(process.cwd(), '../..');
const MEMORY_FILE = join(CLAWD_DIR, 'MEMORY-STRUCTURED.md');
const SOUL_FILE = join(CLAWD_DIR, 'SOUL-STRUCTURED.md');
const MEMORY_DIR = join(CLAWD_DIR, 'memory');

interface Memory {
  owner: {
    name: string;
    alias: string;
    location: string;
    timezone: string;
  };
  family: {
    partner: { name: string; phone: string; work: string };
    children: Array<{ age: number }>;
  };
  people: Array<{
    name: string;
    role: string;
    preferences?: string[];
    key_quote?: string;
  }>;
  automations: Array<{
    name: string;
    schedule: string;
    purpose: string;
  }>;
  priorities: {
    this_week: string[];
    blockers: string[];
  };
  preferences: {
    tools: Record<string, string>;
    behavior: string[];
  };
}

interface Soul {
  identity: {
    name: string;
    owner: string;
    role: string;
    runs_on: string;
    never_sends_to: string[];
  };
  communication: {
    tone: string[];
    avoid: string[];
  };
  do: {
    actions: string[];
    proactive: string[];
  };
  dont: {
    never: string[];
    careful: string[];
  };
  privacy: {
    local_only: string[];
    allowed_external: string[];
  };
}

interface DailyNote {
  date: string;
  summary: string;
  content: string;
}

/**
 * Load and parse MEMORY-STRUCTURED.md
 */
export async function loadMemory(): Promise<Memory> {
  if (!existsSync(MEMORY_FILE)) {
    throw new Error(`Memory file not found: ${MEMORY_FILE}`);
  }
  
  const content = readFileSync(MEMORY_FILE, 'utf-8');
  const { data, content: body } = matter(content);
  
  // Extract YAML blocks from markdown code fences
  const yamlBlocks = extractYamlBlocks(body);
  
  // Parse owner
  const owner = yamlBlocks.find(b => b.includes('name: Martijn'));
  const ownerData = owner ? parseYaml(owner) : {};
  
  // Parse people from sections
  const people = extractPeople(body);
  
  // Parse automations from table
  const automations = extractAutomations(body);
  
  // Parse priorities
  const prioritiesBlock = yamlBlocks.find(b => b.includes('this_week:'));
  const priorities = prioritiesBlock ? parseYaml(prioritiesBlock) : { this_week: [], blockers: [] };
  
  // Parse preferences
  const prefsBlock = yamlBlocks.find(b => b.includes('primary_interface:'));
  const prefs = prefsBlock ? parseYaml(prefsBlock) : { tools: {}, behavior: [] };
  
  return {
    owner: ownerData,
    family: { partner: { name: '', phone: '', work: '' }, children: [] },
    people,
    automations,
    priorities,
    preferences: prefs,
  };
}

/**
 * Load and parse SOUL-STRUCTURED.md
 */
export async function loadSoul(): Promise<Soul> {
  if (!existsSync(SOUL_FILE)) {
    throw new Error(`Soul file not found: ${SOUL_FILE}`);
  }
  
  const content = readFileSync(SOUL_FILE, 'utf-8');
  const { data, content: body } = matter(content);
  
  const yamlBlocks = extractYamlBlocks(body);
  
  // Parse identity
  const identityBlock = yamlBlocks.find(b => b.includes('name: Personal Agent'));
  const identity = identityBlock ? parseYaml(identityBlock) : {};
  
  // Parse communication
  const commBlock = yamlBlocks.find(b => b.includes('tone:'));
  const communication = commBlock ? parseYaml(commBlock) : { tone: [], avoid: [] };
  
  // Parse do/don't
  const doBlock = yamlBlocks.find(b => b.includes('actions:') && !b.includes('never:'));
  const dontBlock = yamlBlocks.find(b => b.includes('never:'));
  
  // Parse privacy
  const privacyBlock = yamlBlocks.find(b => b.includes('local_only:'));
  const privacy = privacyBlock ? parseYaml(privacyBlock) : { local_only: [], allowed_external: [] };
  
  return {
    identity,
    communication,
    do: doBlock ? parseYaml(doBlock) : { actions: [], proactive: [] },
    dont: dontBlock ? parseYaml(dontBlock) : { never: [], careful: [] },
    privacy,
  };
}

/**
 * Load recent daily notes
 */
export async function loadRecentNotes(days: number = 3): Promise<DailyNote[]> {
  if (!existsSync(MEMORY_DIR)) {
    return [];
  }
  
  const files = readdirSync(MEMORY_DIR)
    .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/))
    .sort()
    .reverse()
    .slice(0, days);
  
  return files.map(f => {
    const content = readFileSync(join(MEMORY_DIR, f), 'utf-8');
    const date = f.replace('.md', '');
    
    // Extract first few lines as summary
    const lines = content.split('\n').filter(l => l.trim());
    const summary = lines.slice(0, 5).join(' ').substring(0, 200);
    
    return { date, summary, content };
  });
}

// ========== Helpers ==========

function extractYamlBlocks(content: string): string[] {
  const regex = /```yaml\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    blocks.push(match[1]);
  }
  
  return blocks;
}

function parseYaml(yamlStr: string): any {
  // Simple YAML parser for our structured format
  const result: any = {};
  const lines = yamlStr.split('\n');
  let currentKey = '';
  let currentArray: string[] = [];
  let inArray = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    if (trimmed.startsWith('- ') && inArray) {
      currentArray.push(trimmed.substring(2));
    } else if (trimmed.includes(':')) {
      if (inArray && currentKey) {
        result[currentKey] = currentArray;
        currentArray = [];
        inArray = false;
      }
      
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();
      
      if (value === '' || value.startsWith('[')) {
        currentKey = key;
        if (value.startsWith('[')) {
          // Inline array
          result[key] = value.slice(1, -1).split(',').map(s => s.trim());
        } else {
          inArray = true;
        }
      } else {
        result[key] = value.replace(/^["']|["']$/g, '');
      }
    }
  }
  
  if (inArray && currentKey) {
    result[currentKey] = currentArray;
  }
  
  return result;
}

function extractPeople(content: string): Array<{ name: string; role: string; preferences?: string[] }> {
  const people: Array<{ name: string; role: string }> = [];
  
  // Find ## headings under # PEOPLE
  const peopleSection = content.match(/# 👥 PEOPLE([\s\S]*?)(?=# [^#]|$)/);
  if (!peopleSection) return people;
  
  const section = peopleSection[1];
  const personMatches = section.matchAll(/## (.+)\n```yaml\n([\s\S]*?)```/g);
  
  for (const match of personMatches) {
    const name = match[1].trim();
    const yaml = parseYaml(match[2]);
    people.push({
      name,
      role: yaml.role || '',
      preferences: yaml.preferences,
    });
  }
  
  return people;
}

function extractAutomations(content: string): Array<{ name: string; schedule: string; purpose: string }> {
  const automations: Array<{ name: string; schedule: string; purpose: string }> = [];
  
  // Find markdown table
  const tableMatch = content.match(/\| Name \| Schedule \| Purpose \|([\s\S]*?)(?=\n#|$)/);
  if (!tableMatch) return automations;
  
  const rows = tableMatch[1].split('\n').filter(r => r.includes('|') && !r.includes('---'));
  
  for (const row of rows) {
    const cols = row.split('|').map(c => c.trim()).filter(c => c);
    if (cols.length >= 3) {
      automations.push({
        name: cols[0],
        schedule: cols[1],
        purpose: cols[2],
      });
    }
  }
  
  return automations;
}
