// Each session owns one facts key. Independent writing fields have independent keys,
// so a training checkpoint or another tab editing a different topic cannot erase prose.
const prefix = 'qimai.practice-diary.v1.';
const factsPrefix = prefix + 'session.';
const textPrefix = prefix + 'text.';
const volatile = new Map();
let storage;
try { storage = window.localStorage; } catch {}
let persistent = Boolean(storage);
const changed = id => window.dispatchEvent(new CustomEvent('qimai-diary-change', {detail:{id}}));

function read(key) {
  if (volatile.has(key)) return volatile.get(key);
  try { return storage?.getItem(key) ?? null; }
  catch { persistent = false; return null; }
}

function write(key, value) {
  try {
    if (!storage) throw Error();
    storage.setItem(key, value);
    volatile.delete(key);
    persistent = true;
    return true;
  } catch {
    persistent = false;
    volatile.set(key, value);
    return false;
  }
}

function keys() {
  const result = new Set(volatile.keys());
  try {
    for (let i = 0; storage && i < storage.length; i++) {
      const key = storage.key(i);
      if (key?.startsWith(prefix)) result.add(key);
    }
  } catch { persistent = false; }
  return [...result];
}

function facts(id) {
  try {
    const value = JSON.parse(read(factsPrefix + id));
    return value?.id === id && Array.isArray(value.moves) ? value : null;
  } catch { return null; }
}

function noteWithText(value, allKeys) {
  const base = textPrefix + value.id + '.';
  const drafts = Object.create(null);
  for (const key of allKeys) {
    if (key.startsWith(base + 'draft.')) {
      const text = read(key);
      if (text) drafts[key.slice((base + 'draft.').length)] = text;
    }
  }
  return {...value, feeling:read(base + 'feeling') || '', topic:read(base + 'topic') || '', drafts};
}

export async function storageMode() {
  return storage && persistent && !volatile.size ? 'local' : 'memory';
}

export async function listNotes() {
  const allKeys = keys();
  const grouped = new Map();
  for (const key of allKeys) {
    if (!key.startsWith(textPrefix)) continue;
    const id = key.slice(textPrefix.length).split('.', 1)[0];
    if (!grouped.has(id)) grouped.set(id, []);
    grouped.get(id).push(key);
  }
  return allKeys.filter(key => key.startsWith(factsPrefix))
    .map(key => facts(key.slice(factsPrefix.length))).filter(Boolean)
    .map(value => noteWithText(value, grouped.get(value.id) || []))
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt) || b.id.localeCompare(a.id));
}

export async function getNote(id) {
  const value = facts(id);
  return value ? noteWithText(value, keys()) : null;
}

export async function updateNote(id, patch) {
  const value = facts(id);
  if (!value) throw Error('没有找到这次练习记录');
  const base = textPrefix + id + '.';
  for (const field of ['feeling', 'topic']) {
    if (typeof patch[field] === 'string') write(base + field, patch[field]);
  }
  for (const [topic, draft] of Object.entries(patch.drafts || {})) {
    if (typeof draft === 'string') write(base + 'draft.' + topic, draft);
  }
  changed(id);
  return noteWithText(value, keys());
}

// Only the active training session writes facts for its UUID. Save synchronously
// before pagehide / the automatic stamp-book return can suspend this document.
export function savePractice(value) {
  const earlier = facts(value.id);
  const key = factsPrefix + value.id;
  if (earlier && earlier.revision >= value.revision) return !volatile.has(key);
  const persisted = write(key, JSON.stringify(value));
  changed(value.id);
  return persisted;
}

window.addEventListener('storage', event => {
  if (event.key === null || event.key?.startsWith(prefix)) changed(null);
});
