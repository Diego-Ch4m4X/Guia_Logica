export function headingPlainText(input) {
  return String(input)
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*|~~/g, '')
    .replace(/(^|[^\p{L}\p{N}])_([^_]+)_($|[^\p{L}\p{N}])/gu, '$1$2$3')
    .trim();
}

export function portableBaseSlug(text) {
  const out = [];
  for (const ch of String(text).trim().toLowerCase()) {
    const cp = ch.codePointAt(0);
    if (cp === 0xfe0f || cp === 0xfe0e || cp === 0x200d) continue;
    if (/^[\p{L}\p{N}\p{M}]$/u.test(ch) || ch === '-' || ch === '_') out.push(ch);
    else if (/^\s$/u.test(ch)) out.push('-');
  }
  return out.join('').replace(/^-|-$/g, '');
}

export function createSlugger(reserved = new Set()) {
  const counts = new Map();
  const used = new Set(reserved);
  return text => {
    const base = portableBaseSlug(text) || 'secao';
    let n = counts.get(base) || 0;
    let candidate = n === 0 ? base : `${base}-${n}`;
    while (used.has(candidate)) {
      n += 1;
      candidate = `${base}-${n}`;
    }
    counts.set(base, n + 1);
    used.add(candidate);
    return candidate;
  };
}
