/**
 * Vuelca todas las canciones de Supabase a `.backups/canciones.json` como
 * respaldo local manual. No corre en producción (deploy estático a GitHub
 * Pages, sin backend) — se ejecuta a mano con `npm run backup:songs` cuando
 * se quiera refrescar el respaldo.
 */
const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');

const root = path.resolve(__dirname, '..');
const envFile = path.join(root, '.env');
const target = path.join(root, '.backups', 'canciones.json');

/** Minimal .env parser (mismo formato que scripts/set-env.js). */
function parseEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const result = {};
  for (const rawLine of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function mapSong(row) {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    key: row.key,
    bpm: row.bpm,
    capo: row.capo,
    youtube: row.youtube ?? undefined,
    content: row.content,
    tags: row.tags ?? undefined,
    createdAt: row.created_at,
  };
}

async function main() {
  const fromFile = parseEnvFile(envFile);
  const supabaseUrl = process.env.SUPABASEURL ?? fromFile.SUPABASEURL ?? '';
  const supabaseKey = process.env.SUPABASEKEY ?? fromFile.SUPABASEKEY ?? '';

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      '[export-songs] Falta SUPABASEURL / SUPABASEKEY. Crea un .env en la raíz del repo (ver .env.example).',
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[export-songs] Error al consultar Supabase:', error.message);
    process.exit(1);
  }

  const songs = (data ?? []).map(mapSong);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(songs, null, 2) + '\n');
  console.log(`[export-songs] Escribió ${songs.length} canciones en ${path.relative(root, target)}`);
}

main();
