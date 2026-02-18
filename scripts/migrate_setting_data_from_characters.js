#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase URL or Key in environment. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or service role key).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function buildCharacterItem(row) {
  const traits = [];
  if (row.personality) traits.push(row.personality);
  if (row.appearance) {
    const parts = String(row.appearance).split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
    traits.push(...parts);
  }
  if (row.goals) traits.push(row.goals);

  return {
    name: row.name || '이름 없음',
    aliases: row.aliases || [],
    description: row.description || null,
    traits,
    relationships: row.relationships || {},
    role: row.role || null,
  };
}

async function migrate({ force = false } = {}) {
  console.log('Fetching projects...');
  const { data: projects, error: projErr } = await supabase.from('projects').select('id,title,setting_data');
  if (projErr) {
    console.error('Failed to fetch projects:', projErr.message || projErr);
    process.exit(1);
  }

  for (const p of projects || []) {
    try {
      if (p.setting_data && !force) {
        console.log(`Skipping project ${p.id} (${p.title}) — already has setting_data. Use --force to override.`);
        continue;
      }

      console.log(`Processing project ${p.id} (${p.title})`);
      const { data: chars, error: charErr } = await supabase.from('characters').select('*').eq('project_id', p.id);
      if (charErr) {
        console.warn(`Failed to fetch characters for project ${p.id}:`, charErr.message || charErr);
        continue;
      }

      const characterItems = (chars || []).map(buildCharacterItem);

      const name_mapping = {};
      for (const c of characterItems) {
        name_mapping[c.name] = c.aliases || [];
      }

      const setting_data = {
        characters: characterItems,
        relations: [],
        name_mapping,
        world: [],
        plot_threads: [],
      };

      const { error: upErr } = await supabase.from('projects').update({ setting_data }).eq('id', p.id);
      if (upErr) {
        console.error(`Failed to update project ${p.id}:`, upErr.message || upErr);
      } else {
        console.log(`Updated project ${p.id} setting_data (${characterItems.length} characters)`);
      }
    } catch (err) {
      console.error('Unexpected error for project', p.id, err);
    }
  }

  console.log('Migration complete.');
}

// CLI
const args = process.argv.slice(2);
const force = args.includes('--force');

migrate({ force }).catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
